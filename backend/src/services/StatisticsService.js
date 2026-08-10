import Book from "../models/Book.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import OrderDetail from "../models/OrderDetail.js";
import Category from "../models/Category.js";
import SupplyReceipt from "../models/SupplyReceipt.js";
import SupplyDetail from "../models/SupplyDetail.js";

// Helper: parse date string (YYYY-MM-DD) sang Date object theo giờ Việt Nam (UTC+7)
// Tránh lỗi timezone khi frontend gửi YYYY-MM-DD, bật lưu lú c query end-of-day cho cận trên
function parseDateRange(from, to) {
    const VN_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7
    let fromDate = null;
    let toDate = null;
    if (from) {
        // Đầu ngày theo giờ VN: YYYY-MM-DD 00:00:00 +07:00
        const [y, m, d] = from.split('-').map(Number);
        fromDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - VN_OFFSET_MS);
    }
    if (to) {
        // Cuối ngày theo giờ VN: YYYY-MM-DD 23:59:59.999 +07:00
        const [y, m, d] = to.split('-').map(Number);
        toDate = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - VN_OFFSET_MS);
    }
    return { fromDate, toDate };
}

// Tổng quan: tổng sách, users, đơn hàng, doanh thu, lợi nhuận, low stock
export async function getOverviewStatsService(from, to) {
    try {
        const [
            totalBooks,
            totalUsers,
            totalCategories,
            lowStockBooks
        ] = await Promise.all([
            Book.countDocuments({ isDeleted: false }),
            User.countDocuments({ role: "user" }), // Chỉ đếm khách hàng, không đếm admin
            Category.countDocuments(),
            Book.countDocuments({ quantity: { $lte: 10 }, isDeleted: false })
        ]);

        // Build match condition for orders with optional date filter
        const orderMatchCondition = {};
        if (from || to) {
            const { fromDate, toDate } = parseDateRange(from, to);
            orderMatchCondition.createdAt = {};
            if (fromDate) orderMatchCondition.createdAt.$gte = fromDate;
            if (toDate) orderMatchCondition.createdAt.$lte = toDate;
        }

        const [
            totalOrders,
            completedOrders,
            pendingOrders,
            cancelledOrders
        ] = await Promise.all([
            Order.countDocuments(orderMatchCondition),
            Order.countDocuments({ ...orderMatchCondition, purchaseStatus: "completed" }),
            Order.countDocuments({ ...orderMatchCondition, purchaseStatus: "pending" }),
            Order.countDocuments({ ...orderMatchCondition, purchaseStatus: "canceled" })
        ]);

        // Tính tổng doanh thu từ đơn hàng completed
        const revenueResult = await Order.aggregate([
            { $match: { ...orderMatchCondition, purchaseStatus: "completed" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Tính tổng giá trị tất cả đơn hàng (không phân trạng thái)
        const totalOrderValueResult = await Order.aggregate([
            { $match: { ...(orderMatchCondition || {}) } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalOrderValue = totalOrderValueResult.length > 0 ? totalOrderValueResult[0].total : 0;

        // Tính tổng theo trạng thái đơn (completed, pending, canceled)
        const byStatus = await Order.aggregate([
            { $match: { ...(orderMatchCondition || {}) } },
            { $group: { _id: "$purchaseStatus", total: { $sum: "$totalAmount" } } }
        ]);
        let paidAmount = 0;
        let pendingAmount = 0;
        let cancelledAmount = 0;
        byStatus.forEach(s => {
            const key = (s._id || "").toString();
            if (key === "completed") paidAmount = s.total;
            else if (key === "pending") pendingAmount = s.total;
            else if (key === "canceled" || key === "cancelled") cancelledAmount = s.total;
        });

        // Build match condition for supply receipts with optional date filter
        const supplyMatchCondition = { purchaseStatus: "completed" };
        if (from || to) {
            const { fromDate, toDate } = parseDateRange(from, to);
            supplyMatchCondition.createdAt = {};
            if (fromDate) supplyMatchCondition.createdAt.$gte = fromDate;
            if (toDate) supplyMatchCondition.createdAt.$lte = toDate;
        }

        // Tính tổng chi phí nhập hàng - CHỈ từ phiếu đã hoàn tất
        const costResult = await SupplyReceipt.aggregate([
            { $match: supplyMatchCondition }, // Chỉ lấy phiếu hoàn tất
            {
                $lookup: {
                    from: "supplydetails",
                    localField: "_id",
                    foreignField: "receiptId",
                    as: "details"
                }
            },
            { $unwind: "$details" },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: { $multiply: ["$details.quantity", "$details.importPrice"] }
                    }
                }
            }
        ]);
        const totalCost = costResult.length > 0 ? costResult[0].total : 0;

        // Lợi nhuận = Doanh thu - Chi phí
        const totalProfit = totalRevenue - totalCost;

        return {
            success: true,
            data: {
                totalBooks,
                totalUsers,
                totalOrders,
                totalRevenue,
                totalOrderValue,
                paidAmount,
                pendingAmount,
                cancelledAmount,
                totalCategories,
                lowStockBooks,
                pendingOrders,
                completedOrders,
                cancelledOrders,
                totalProfit,
                totalCost
            }
        };
    } catch (error) {
        console.error("Error in getOverviewStatsService:", error);
        throw error;
    }
}

// Thống kê doanh thu theo thời gian
export async function getRevenueStatsService(period = "month", from, to) {
    try {
        let groupBy;
        let dateFormat;

        // Xác định cách group theo period
        switch (period) {
            case "day":
                groupBy = {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" }
                };
                dateFormat = "%Y-%m-%d";
                break;
            case "year":
                groupBy = {
                    year: { $year: "$createdAt" }
                };
                dateFormat = "%Y";
                break;
            default: // month
                groupBy = {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                };
                dateFormat = "%Y-%m";
        }

        // Build match condition
        const matchCondition = { purchaseStatus: "completed" };
        if (from || to) {
            const { fromDate, toDate } = parseDateRange(from, to);
            matchCondition.createdAt = {};
            if (fromDate) matchCondition.createdAt.$gte = fromDate;
            if (toDate) matchCondition.createdAt.$lte = toDate;
        }

        const revenue = await Order.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: groupBy,
                    revenue: { $sum: "$totalAmount" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);

        // Format response
        const formattedData = revenue.map(item => {
            let label;
            if (period === "day") {
                label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
            } else if (period === "year") {
                label = `${item._id.year}`;
            } else {
                label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
            }
            return {
                period: label,
                revenue: item.revenue,
                orderCount: item.orderCount
            };
        });

        return {
            success: true,
            data: formattedData
        };
    } catch (error) {
        console.error("Error in getRevenueStatsService:", error);
        throw error;
    }
}

// Thống kê lợi nhuận theo thời gian
export async function getProfitStatsService(period = "month", from, to) {
    try {
        // Lấy doanh thu
        const revenueData = await getRevenueStatsService(period, from, to);

        // Lấy chi phí nhập hàng theo thời gian
        let groupBy;
        switch (period) {
            case "day":
                groupBy = {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" }
                };
                break;
            case "year":
                groupBy = {
                    year: { $year: "$createdAt" }
                };
                break;
            default: // month
                groupBy = {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                };
        }

        const matchCondition = { purchaseStatus: "completed" }; // Chỉ lấy phiếu hoàn tất
        if (from || to) {
            const { fromDate, toDate } = parseDateRange(from, to);
            matchCondition.createdAt = {};
            if (fromDate) matchCondition.createdAt.$gte = fromDate;
            if (toDate) matchCondition.createdAt.$lte = toDate;
        }

        const costs = await SupplyReceipt.aggregate([
            { $match: matchCondition },
            {
                $lookup: {
                    from: "supplydetails",
                    localField: "_id",
                    foreignField: "receiptId",
                    as: "details"
                }
            },
            { $unwind: "$details" },
            {
                $group: {
                    _id: groupBy,
                    cost: {
                        $sum: { $multiply: ["$details.quantity", "$details.importPrice"] }
                    }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);

        // Map costs by period
        const costMap = {};
        costs.forEach(item => {
            let label;
            if (period === "day") {
                label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
            } else if (period === "year") {
                label = `${item._id.year}`;
            } else {
                label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
            }
            costMap[label] = item.cost;
        });

        // Combine revenue and cost to calculate profit
        const profitData = revenueData.data.map(item => ({
            period: item.period,
            revenue: item.revenue,
            cost: costMap[item.period] || 0,
            profit: item.revenue - (costMap[item.period] || 0),
            orderCount: item.orderCount
        }));

        return {
            success: true,
            data: profitData
        };
    } catch (error) {
        console.error("Error in getProfitStatsService:", error);
        throw error;
    }
}

// Top sản phẩm bán chạy
export async function getTopProductsService(limit = 10, from, to) {
    try {
        // Build match for orders in optional date range
        const orderMatch = { "order.purchaseStatus": "completed" };
        if (from || to) {
            const { fromDate, toDate } = parseDateRange(from, to);
            const createdAtMatch = {};
            if (fromDate) createdAtMatch.$gte = fromDate;
            if (toDate) createdAtMatch.$lte = toDate;
            orderMatch["order.createdAt"] = createdAtMatch;
        }

        const topProducts = await OrderDetail.aggregate([
            {
                $lookup: {
                    from: "orders",
                    localField: "orderId",
                    foreignField: "_id",
                    as: "order"
                }
            },
            { $unwind: "$order" },
            { $match: orderMatch },
            {
                $group: {
                    _id: "$bookId",
                    totalQuantity: { $sum: "$quantity" },
                    totalRevenue: { $sum: { $multiply: ["$quantity", "$price"] } }
                }
            },
            {
                $lookup: {
                    from: "books",
                    localField: "_id",
                    foreignField: "_id",
                    as: "book"
                }
            },
            { $unwind: "$book" },
            {
                $project: {
                    bookId: "$_id",
                    bookName: "$book.name",
                    bookImage: { $arrayElemAt: ["$book.imageUrl", 0] },
                    totalQuantity: 1,
                    totalRevenue: 1
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: limit }
        ]);

        return {
            success: true,
            data: topProducts
        };
    } catch (error) {
        console.error("Error in getTopProductsService:", error);
        throw error;
    }
}

// Thống kê đơn hàng
export async function getOrderStatsService() {
    try {
        const [statusStats, recentOrders] = await Promise.all([
            Order.aggregate([
                {
                    $group: {
                        _id: "$purchaseStatus",
                        count: { $sum: 1 },
                        totalValue: { $sum: "$totalAmount" }
                    }
                }
            ]),
            Order.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("customerId", "fullName email")
                .lean()
        ]);

        return {
            success: true,
            data: {
                byStatus: statusStats,
                recent: recentOrders
            }
        };
    } catch (error) {
        console.error("Error in getOrderStatsService:", error);
        throw error;
    }
}

// Top categories by revenue
export async function getTopCategoriesService(limit = 5, from, to) {
    try {
        // Build match for orders in optional date range
        const orderMatch = { "order.purchaseStatus": "completed" };
        if (from || to) {
            const { fromDate, toDate } = parseDateRange(from, to);
            const createdAtMatch = {};
            if (fromDate) createdAtMatch.$gte = fromDate;
            if (toDate) createdAtMatch.$lte = toDate;
            orderMatch["order.createdAt"] = createdAtMatch;
        }

        const topCategories = await OrderDetail.aggregate([
            // Lookup order info
            {
                $lookup: {
                    from: "orders",
                    localField: "orderId",
                    foreignField: "_id",
                    as: "order"
                }
            },
            { $unwind: "$order" },
            // Only completed orders and optional date range
            { $match: orderMatch },
            // Lookup book info
            {
                $lookup: {
                    from: "books",
                    localField: "bookId",
                    foreignField: "_id",
                    as: "book"
                }
            },
            { $unwind: "$book" },
            // Lookup category
            {
                $lookup: {
                    from: "categories",
                    localField: "book.categoryId",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            // Group by category
            {
                $group: {
                    _id: "$category._id",
                    categoryName: { $first: "$category.name" },
                    totalRevenue: { $sum: { $multiply: ["$quantity", "$price"] } },
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: parseInt(limit) }
        ]);

        // Calculate total revenue for percentage
        const totalRevenue = topCategories.reduce((sum, cat) => sum + cat.totalRevenue, 0);

        const categoriesWithPercentage = topCategories.map(cat => ({
            categoryId: cat._id,
            name: cat.categoryName,
            revenue: cat.totalRevenue,
            quantity: cat.totalQuantity,
            percentage: totalRevenue > 0 ? Math.round((cat.totalRevenue / totalRevenue) * 100) : 0
        }));

        return {
            success: true,
            data: categoriesWithPercentage
        };
    } catch (error) {
        console.error("Error in getTopCategoriesService:", error);
        throw error;
    }
}

// Payment methods breakdown
export async function getPaymentMethodsStatsService(from, to) {
    try {
        // Build match condition for optional date range
        const match = {};
        if (from || to) {
            const { fromDate, toDate } = parseDateRange(from, to);
            match.createdAt = {};
            if (fromDate) match.createdAt.$gte = fromDate;
            if (toDate) match.createdAt.$lte = toDate;
        }

        const pipeline = [];
        if (Object.keys(match).length > 0) pipeline.push({ $match: match });
        pipeline.push(
            {
                $group: {
                    _id: "$paymentMethod",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" }
                }
            },
        );
        pipeline.push({ $sort: { count: -1 } });

        const paymentStats = await Order.aggregate(pipeline);

        // Calculate total orders for percentage
        // Optionally filter out unwanted methods at server-side (vnpay, payos)
        const filtered = paymentStats.filter(s => {
            const m = (s._id || "").toString().toLowerCase();
            return m !== "vnpay" && m !== "payos";
        });

        const totalOrders = filtered.reduce((sum, stat) => sum + stat.count, 0);

        const methodsWithPercentage = filtered.map(stat => ({
            method: stat._id,
            count: stat.count,
            totalAmount: stat.totalAmount,
            percentage: totalOrders > 0 ? Math.round((stat.count / totalOrders) * 100) : 0
        }));

        return {
            success: true,
            data: {
                methods: methodsWithPercentage,
                totalOrders
            }
        };
    } catch (error) {
        console.error("Error in getPaymentMethodsStatsService:", error);
        throw error;
    }
}

// Comparison stats with previous period
export async function getComparisonStatsService() {
    try {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Current month stats
        const [
            currentRevenue,
            currentOrders,
            currentUsers
        ] = await Promise.all([
            Order.aggregate([
                { $match: { purchaseStatus: "completed", createdAt: { $gte: currentMonthStart } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]),
            Order.countDocuments({ createdAt: { $gte: currentMonthStart } }),
            User.countDocuments({ role: "user", createdAt: { $gte: currentMonthStart } })
        ]);

        // Last month stats
        const [
            lastRevenue,
            lastOrders,
            lastUsers
        ] = await Promise.all([
            Order.aggregate([
                { $match: { purchaseStatus: "completed", createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]),
            Order.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
            User.countDocuments({ role: "user", createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } })
        ]);

        const currentRevenueVal = currentRevenue.length > 0 ? currentRevenue[0].total : 0;
        const lastRevenueVal = lastRevenue.length > 0 ? lastRevenue[0].total : 0;

        // Calculate percentage changes
        const calculateChange = (current, last) => {
            if (last === 0) return current > 0 ? 100 : 0;
            return ((current - last) / last) * 100;
        };

        // Calculate profit change (simplified: revenue - estimated cost)
        const currentProfit = currentRevenueVal * 0.3; // Assume 30% margin
        const lastProfit = lastRevenueVal * 0.3;

        return {
            success: true,
            data: {
                revenueChange: calculateChange(currentRevenueVal, lastRevenueVal),
                ordersChange: calculateChange(currentOrders, lastOrders),
                profitChange: calculateChange(currentProfit, lastProfit),
                usersChange: calculateChange(currentUsers, lastUsers)
            }
        };
    } catch (error) {
        console.error("Error in getComparisonStatsService:", error);
        throw error;
    }
}

// Order status counts with optional date range filtering
export async function getOrderStatusStatsService(from, to) {
    try {
        const matchCondition = {};
        if (from || to) {
            const { fromDate, toDate } = parseDateRange(from, to);
            matchCondition.createdAt = {};
            if (fromDate) matchCondition.createdAt.$gte = fromDate;
            if (toDate) matchCondition.createdAt.$lte = toDate;
        }

        const statusStats = await Order.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: "$purchaseStatus",
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            success: true,
            data: statusStats
        };
    } catch (error) {
        console.error("Error in getOrderStatusStatsService:", error);
        throw error;
    }
}
