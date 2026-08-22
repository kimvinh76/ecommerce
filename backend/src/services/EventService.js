import Event from '../models/Event.js';

// Tao su kien giam gia, kiem tra du lieu bat buoc
export async function createEventService(eventData) {
  try {
    const { name, description, discountPercent, startDate, endDate, applyType, bookIds, categoryIds } = eventData;
    
    if (!name || !discountPercent || !startDate || !endDate || !applyType) {
      throw new Error('Thiếu thông tin bắt buộc');
    }

    // applyType quyet dinh pham vi ap dung giam gia
    if (!['all', 'products', 'categories'].includes(applyType)) {
      throw new Error('ApplyType không hợp lệ');
    }

    const eventPayload = {
      name,
      description,
      discountPercent,
      startDate,
      endDate,
      applyType,
      status: 'upcoming'
    };

    // Neu ap dung theo san pham/nhom, chi gan dung danh sach id
    if (applyType === 'products' && bookIds) {
      eventPayload.bookIds = Array.isArray(bookIds) ? bookIds : [bookIds];
    } else if (applyType === 'categories' && categoryIds) {
      eventPayload.categoryIds = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
    }

    const newEvent = await Event.create(eventPayload);

    return newEvent;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Lay danh sach su kien (co phan trang)
export async function getAllEventsService(query = {}) {
  try {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const search = query.search || "";
    const skip = (page - 1) * limit;

    let filter = {};
    if (search) {
      filter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const events = await Event.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Event.countDocuments(filter);

    return {
      events,
      totalEvents: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

// Lay chi tiet su kien theo id, kem thong tin sach/nhom
export async function getEventByIdService(eventId) {
  try {
    const event = await Event.findById(eventId)
      .populate('bookIds', 'name price imageUrl')
      .populate('categoryIds', 'name');
    
    if (!event) {
      throw new Error('Event không tồn tại');
    }

    return event;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Cap nhat su kien (noi dung + pham vi ap dung)
export async function updateEventService(eventId, eventData) {
  try {
    const { applyType, bookIds, categoryIds, ...otherData } = eventData;
    
    const updatePayload = { ...otherData, updatedAt: Date.now() };

    if (applyType) {
      if (!['all', 'products', 'categories'].includes(applyType)) {
        throw new Error('ApplyType không hợp lệ');
      }
      updatePayload.applyType = applyType;
      
      // Doi pham vi ap dung thi xoa danh sach cu va gan lai
      updatePayload.bookIds = [];
      updatePayload.categoryIds = [];
      
      if (applyType === 'products' && bookIds) {
        updatePayload.bookIds = Array.isArray(bookIds) ? bookIds : [bookIds];
      } else if (applyType === 'categories' && categoryIds) {
        updatePayload.categoryIds = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
      }
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      updatePayload,
      { new: true, runValidators: true }
    ).populate('bookIds', 'name price imageUrl')
     .populate('categoryIds', 'name');

    if (!event) {
      throw new Error('Event không tồn tại');
    }

    return event;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Xoa su kien
export async function deleteEventService(eventId) {
  try {
    const event = await Event.findByIdAndDelete(eventId);
    if (!event) {
      throw new Error('Event không tồn tại');
    }

    return event;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Lay su kien dang hoat dong (status active + con trong thoi gian)
export async function getActiveEventsService() {
  try {
    const now = new Date();
    const activeEvents = await Event.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    return activeEvents;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Cap nhat trang thai su kien (admin)
export async function updateEventStatusService(eventId, status) {
  try {
    if (!['active', 'inactive', 'upcoming'].includes(status)) {
      throw new Error('Trạng thái không hợp lệ');
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!event) {
      throw new Error('Event không tồn tại');
    }

    return event;
  } catch (err) {
    throw new Error(err.message);
  }
}
