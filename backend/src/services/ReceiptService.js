import Order from '../models/Order.js';
import Book from '../models/Book.js';
import SupplyReceipt from '../models/SupplyReceipt.js';
import SupplyDetail from '../models/SupplyDetail.js';
import Supplier from '../models/Supplier.js';

// Lấy tất cả phiếu nhập hàng (có phân trang, lọc, tìm kiếm)
export async function getAllSupplyReceiptsService(page = 1, limit = 10, status = '', search = '') {
  const query = {};
    
  if (status) {
    query.purchaseStatus = status;
  }

  if (search) {
    const searchConditions = [];
    
    // 1. Tìm nhà cung cấp theo tên
    const matchedSuppliers = await Supplier.find({ name: { $regex: search, $options: 'i' } }).select('_id');
    if (matchedSuppliers.length > 0) {
      searchConditions.push({ supplierId: { $in: matchedSuppliers.map(s => s._id) } });
    }
    
    // 2. Tìm theo mã phiếu nhập (nếu là ObjectId hợp lệ)
    if (/^[0-9a-fA-F]{24}$/.test(search)) {
      searchConditions.push({ _id: search });
    }

    if (searchConditions.length > 0) {
      query.$or = searchConditions;
    } else {
      // Không khớp gì thì không trả về
      query._id = null;
    }
  }

  const receipts = await SupplyReceipt.find(query)
    .populate('adminId', 'fullName email')
    .populate('supplierId', 'name phone email address')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  // Lấy details cho mỗi receipt
  const receiptsWithDetails = await Promise.all(
    receipts.map(async (receipt) => {
      const details = await SupplyDetail.find({ receiptId: receipt._id })
        .populate({
          path: 'bookId',
          select: 'name price imageUrl isDeleted'
        });
      return { ...receipt, details };
    })
  );

  const total = await SupplyReceipt.countDocuments(query);

  return {
    data: receiptsWithDetails,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// Tao phieu nhap + chi tiet, tinh tong tien tu chi tiet
export async function createSupplyReceiptService(adminId, supplierId, details) {
  // Tính tổng tiền trước
  let totalAmount = 0;
  if (details && details.length > 0) {
    totalAmount = details.reduce((sum, item) => sum + (item.importPrice * item.quantity), 0);
  }

  const receipt = await SupplyReceipt.create({
    adminId: adminId || null,
    supplierId: supplierId,
    purchaseStatus: 'pending',
    totalAmount: totalAmount
  });
  if (details && details.length > 0) {
    await Promise.all(
      details.map(async item => {
          // Kiem tra book va so lieu hop le truoc khi tao chi tiet
          const book = await Book.findById(item.bookId);
          if (!book) {
            throw new Error(`Book with id ${item.bookId} not found`);
          }
          if (item.quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
          }
          if (item.importPrice <= 0) {
            throw new Error('Import price must be greater than 0');
          }

          return await SupplyDetail.create({
            receiptId: receipt._id,
            bookId: book._id,
            quantity: item.quantity,
            importPrice: item.importPrice
          });
        }
      )
    );
  }
  const populatedReceipt = await SupplyReceipt.findById(receipt._id)
    .populate('adminId', 'fullName email')
    .populate('supplierId', 'name phone')
    .lean();
  
  const detailDocs = await SupplyDetail.find({ receiptId: receipt._id })
    .populate({
      path: 'bookId',
      select: 'name price imageUrl isDeleted'
    });
  
  populatedReceipt.details = detailDocs;
  return populatedReceipt;
}

// Cap nhat thong tin phieu nhap (chi duoc sua khi pending)
export async function updateSupplyReceiptService(receiptId, adminId, supplierId, purchaseStatus, supplyDate, details) {
  const existingReceipt = await SupplyReceipt.findById(receiptId);
  if (!existingReceipt) {
    throw new Error(`Supply Receipt with id ${receiptId} not found`);
  }
  // Lay trang thai hien tai va trang thai muon cap nhat
  const oldStatus = existingReceipt.purchaseStatus?.toString() || 'pending';
  const nextStatus = (purchaseStatus || oldStatus).toString();
  const ALLOWED_STATUSES = ['pending', 'completed', 'canceled'];

  if (!ALLOWED_STATUSES.includes(nextStatus)) {
    throw new Error('Invalid purchase status');
  }

  // Khong cho doi trang thai trong API cap nhat chi tiet; chi doi status qua endpoint rieng.
  if (purchaseStatus && nextStatus !== oldStatus) {
    throw new Error('Status must be updated via status endpoint');
  }

  // Chỉ cho phép sửa phiếu khi phiếu còn pending để tránh sai lệch lịch sử nhập hàng.
  if (oldStatus !== 'pending') {
    throw new Error('Only pending receipts can be edited');
  }

  const oldDetailsDocs = await SupplyDetail.find({ receiptId: existingReceipt._id });
  const oldDetails = oldDetailsDocs.map((item) => ({
    bookId: item.bookId.toString(),
    quantity: item.quantity,
    importPrice: item.importPrice
  }));

  // Neu client khong gui details, giu nguyen chi tiet cu
  const incomingDetails = Array.isArray(details) ? details : oldDetails;
  if (Array.isArray(details) && details.length === 0) {
    throw new Error('Receipt must have at least one item');
  }

  // Chuan hoa details (kiem tra du lieu + gan receiptId, bookId)
  const normalizedNewDetails = [];
  for (const item of incomingDetails) {
    if (!item.bookId) {
      throw new Error('Book is required for each receipt item');
    }
    if (item.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    if (item.importPrice <= 0) {
      throw new Error('Import price must be greater than 0');
    }

    const book = await Book.findById(item.bookId);
    if (!book) {
      throw new Error(`Book with id ${item.bookId} not found`);
    }

    normalizedNewDetails.push({
      receiptId: existingReceipt._id,
      bookId: book._id,
      quantity: item.quantity,
      importPrice: item.importPrice
    });
  }

  // Tinh lai tong tien theo chi tiet moi
  const totalAmount = normalizedNewDetails.reduce((sum, item) => sum + (item.importPrice * item.quantity), 0);

  const receipt = await SupplyReceipt.findByIdAndUpdate(
    receiptId,
    {
      adminId: adminId || undefined,
      supplierId: supplierId || existingReceipt.supplierId,
      purchaseStatus: nextStatus,
      supplyDate: supplyDate || existingReceipt.supplyDate,
      totalAmount: totalAmount
    },
    { new: true }
  );

  // Chi cap nhat chi tiet khi client gui details moi
  if (Array.isArray(details)) {
    await SupplyDetail.deleteMany({ receiptId: existingReceipt._id });
    if (normalizedNewDetails.length > 0) {
      await SupplyDetail.insertMany(normalizedNewDetails);
    }
  }

  const populatedReceipt = await SupplyReceipt.findById(receipt._id)
    .populate('adminId', 'fullName email')
    .populate('supplierId', 'name phone')
    .lean();
  
  const detailDocs = await SupplyDetail.find({ receiptId: receipt._id })
    .populate({
      path: 'bookId',
      select: 'name price imageUrl isDeleted'
    });
  
  populatedReceipt.details = detailDocs;
  return populatedReceipt;
}

// Lay danh sach phieu nhap theo admin
export async function getAllReceiptsByAdminId(adminId) {
  const receipts = await SupplyReceipt.find({ adminId: adminId })
    .populate('adminId', 'fullName email')
    .populate('supplierId', 'name phone')
    .lean();
  
  // Them chi tiet cho moi phieu
  const receiptsWithDetails = await Promise.all(
    receipts.map(async (receipt) => ({
      ...receipt,
      details: await SupplyDetail.find({ receiptId: receipt._id })
    }))
  );
  return receiptsWithDetails;
}

// Lay chi tiet mot phieu nhap
export async function getReceiptByIdService(receiptId) {
  const receipt = await SupplyReceipt.findById(receiptId)
    .populate('adminId', 'fullName email')
    .populate('supplierId', 'name phone')
    .lean();
  if (!receipt) {
    throw new Error(`Supply Receipt with id ${receiptId} not found`);
  }
  receipt.details = await SupplyDetail.find({ receiptId: receipt._id });
  return receipt;
}

// Cap nhat trang thai phieu (pending -> completed/canceled)
export async function updatePurchaseStatusService(receiptId, adminId, purchaseStatus) {
  const receipt = await SupplyReceipt.findById(receiptId);
  if (!receipt) {
    throw new Error(`Supply Receipt with id ${receiptId} not found`);
  }

  const oldStatus = receipt.purchaseStatus?.toString() || 'pending';
  const nextStatus = (purchaseStatus || oldStatus).toString();
  const ALLOWED_TARGET_STATUSES = ['completed', 'canceled'];
  if (!ALLOWED_TARGET_STATUSES.includes(nextStatus)) {
    throw new Error('Invalid purchase status');
  }

  // Luong hop le: pending -> completed/canceled; completed/canceled la diem cuoi.
  const canTransition =
    oldStatus === 'pending' && (nextStatus === 'completed' || nextStatus === 'canceled');

  if (!canTransition) {
    throw new Error('Invalid status transition');
  }

  const supplyDetails = await SupplyDetail.find({ receiptId: receipt._id });
  if (supplyDetails.length === 0) {
    throw new Error(`Supply details not found`);
  }

  // Gom so luong theo tung sach (de cap nhat ton kho)
  const qtyMap = new Map();
  for (const item of supplyDetails) {
    const key = item.bookId.toString();
    qtyMap.set(key, (qtyMap.get(key) || 0) + Number(item.quantity || 0));
  }

  // Chi cong ton kho khi xac nhan phieu nhap.
  const oldApplied = oldStatus === 'completed';
  const nextApplied = nextStatus === 'completed';

  // Chi cong ton kho mot lan khi chuyen sang completed
  if (!oldApplied && nextApplied) {
    for (const [bookId, qty] of qtyMap.entries()) {
      const book = await Book.findById(bookId);
      if (!book) {
        throw new Error(`Book with id ${bookId} not found`);
      }
      book.quantity = (book.quantity || 0) + qty;
      await book.save();
    }
  }

  receipt.purchaseStatus = nextStatus;
  receipt.adminId = adminId || receipt.adminId;
  await receipt.save();
  return receipt;
}