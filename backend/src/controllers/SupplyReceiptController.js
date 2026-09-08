import {
  getAllSupplyReceiptsService,
  createSupplyReceiptService,
  updateSupplyReceiptService,
  updatePurchaseStatusService
} from '../services/ReceiptService.js';
import SupplyReceipt from '../models/SupplyReceipt.js';
import SupplyDetail from '../models/SupplyDetail.js';
import Supplier from '../models/Supplier.js';

// Lấy tất cả phiếu nhập hàng
export async function getAllSupplyReceipts(req, res) {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    const result = await getAllSupplyReceiptsService(page, limit, status, search);

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Lấy phiếu nhập theo ID
export async function getSupplyReceiptById(req, res) {
  try {
    const { id } = req.params;
    
    const receipt = await SupplyReceipt.findById(id)
      .populate('adminId', 'fullName email')
      .populate('supplierId', 'name phone email address')
      .lean();

    if (!receipt) {
      return res.status(404).json({ message: 'Phiếu nhập không tồn tại' });
    }

    const details = await SupplyDetail.find({ receiptId: receipt._id })
      .populate({
        path: 'bookId',
        select: 'name price imageUrl quantity isDeleted'
      });

    res.status(200).json({ ...receipt, details });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Tạo phiếu nhập mới
export async function createSupplyReceipt(req, res) {
  try {
    const { supplierId, details } = req.body;
    const adminId = req.user?._id || null; // Lấy từ middleware auth (nếu có)

    if (!supplierId) {
      return res.status(400).json({ message: 'Vui lòng chọn nhà cung cấp' });
    }

    if (!details || details.length === 0) {
      return res.status(400).json({ message: 'Vui lòng thêm ít nhất 1 sản phẩm' });
    }

    const receipt = await createSupplyReceiptService(adminId, supplierId, details);
    res.status(201).json(receipt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Cập nhật phiếu nhập
export async function updateSupplyReceipt(req, res) {
  try {
    const { id } = req.params;
    const { supplierId, purchaseStatus, supplyDate, details } = req.body;
    const adminId = req.user?._id || null;

    const receipt = await updateSupplyReceiptService(
      id,
      adminId,
      supplierId,
      purchaseStatus,
      supplyDate,
      details
    );

    res.status(200).json(receipt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Cập nhật trạng thái phiếu nhập
export async function updateSupplyReceiptStatus(req, res) {
  try {
    const { id } = req.params;
    const { purchaseStatus } = req.body;
    const adminId = req.user._id;

    if (!purchaseStatus) {
      return res.status(400).json({ message: 'Vui lòng chọn trạng thái' });
    }

    const receipt = await updatePurchaseStatusService(id, adminId, purchaseStatus);
    res.status(200).json(receipt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Thống kê phiếu nhập
export async function getSupplyReceiptStats(req, res) {
  try {
    const stats = await SupplyReceipt.aggregate([
      {
        $group: {
          _id: '$purchaseStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalReceipts = await SupplyReceipt.countDocuments();

    // Tính tổng tiền nhập hàng
    const totalAmount = await SupplyDetail.aggregate([
      {
        $lookup: {
          from: 'supplierreceipts',
          localField: 'receiptId',
          foreignField: '_id',
          as: 'receipt'
        }
      },
      {
        $unwind: '$receipt'
      },
      {
        $match: {
          'receipt.purchaseStatus': 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$importPrice', '$quantity'] } }
        }
      }
    ]);

    res.status(200).json({
      totalReceipts,
      statusStats: stats,
      totalAmount: totalAmount[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
