# 📚 Super Book — Nền tảng Bán sách Trực tuyến

Hệ thống thương mại điện tử chuyên bán sách, xây dựng bằng **Node.js + Express** (backend) và **Next.js + TypeScript** (frontend). Ứng dụng hỗ trợ mua sắm cho cả khách vãng lai và người dùng đăng nhập, tích hợp thanh toán **PayOS** và lưu trữ ảnh **Cloudinary**.

---

## 🌐 Demo đã deploy

| | Link |
|---|---|
| **Frontend** | [https://ecommerce-1-rkc0.onrender.com](https://ecommerce-1-rkc0.onrender.com) |
| **Backend API** | [https://ecommerce-mt45.onrender.com](https://ecommerce-mt45.onrender.com) |

> ⚠️ Dùng Render free tier — server có thể mất vài giây khởi động lại lần đầu.

---

## 🛠️ Công nghệ sử dụng

| Phần | Công nghệ |
|------|-----------|
| **Backend** | Node.js · Express.js · MongoDB + Mongoose · JWT · Cloudinary · PayOS · Nodemailer · Passport OAuth |
| **Frontend** | Next.js 15 · TypeScript · Tailwind CSS · Zustand · SWR · React Hook Form · Zod · Axios · SweetAlert2 |

---

## ⚙️ Cài đặt & Chạy cục bộ

### Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/super_book
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
MAIL_USER=...
MAIL_PASS=...
FRONTEND_URL=http://localhost:3001
```

```bash
npm run dev    # Phát triển (nodemon tự reload)
npm start      # Production
```

> ✅ Backend chạy tại `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
```

Tạo file `.env.local` trong thư mục `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

```bash
npm run dev      # Phát triển
npm run build    # Build production
npm start        # Chạy sau khi build
```

> ✅ Frontend chạy tại `http://localhost:3001`

---

## 🔌 Danh sách API

| Endpoint | Chức năng |
|----------|-----------|
| `/api/auth` | Đăng ký, đăng nhập, refresh token |
| `/api/users` | Quản lý người dùng |
| `/api/books` | CRUD sách, tìm kiếm, lọc, phân trang |
| `/api/categories` | Danh mục |
| `/api/authors` | Tác giả |
| `/api/publishers` | Nhà xuất bản |
| `/api/suppliers` | Nhà cung cấp |
| `/api/supply-receipts` | Phiếu nhập hàng |
| `/api/cart` | Giỏ hàng (user + guest) |
| `/api/orders` | Đơn hàng |
| `/api/payment` | Thanh toán PayOS + webhook |
| `/api/coupons` | Mã giảm giá |
| `/api/events` | Sự kiện khuyến mại |
| `/api/reviews` | Đánh giá sản phẩm |
| `/api/addresses` | Địa chỉ giao hàng |
| `/api/statistics` | Thống kê doanh số (admin) |

📄 Chi tiết: [API_TEST_DOCUMENTATION.md](API_TEST_DOCUMENTATION.md) · 📦 Postman: [BookStore_API.postman_collection.json](BookStore_API.postman_collection.json)

---

## 👤 Vai trò trong dự án

Phụ trách phần lớn **giao diện Admin Dashboard**, tích hợp các **API nghiệp vụ phức tạp** và xử lý các lỗi logic quan trọng của hệ thống.

### ✅ Đã hoàn thành

**Thanh toán & Đơn hàng**
- Tích hợp PayOS: tạo link thanh toán, xử lý webhook, cập nhật trạng thái đơn tự động
- Cho phép thanh toán lại khi đơn `failed` hoặc đã hủy lần trước
- Tự động hủy đơn chưa thanh toán sau 1 ngày; hủy ngay sau 10 phút nếu thanh toán thất bại
- Logic tồn kho chuẩn E-commerce: trừ khi xác nhận, cộng lại khi hủy ở trạng thái `delivery`
- Hiển thị badge trạng thái: `refunded`, `failed`, `pending payment`

**Giỏ hàng & Giá cả**
- Đồng bộ giỏ hàng khi admin xóa sản phẩm — loại tự động sản phẩm `isDeleted`, cập nhật tổng tiền
- Đảm bảo giá khuyến mãi nhất quán từ cart → checkout → order
- Hỗ trợ giỏ hàng cho cả khách vãng lai (guest session) và user đã đăng nhập

**Sự kiện Giảm giá (Admin)**
- CRUD sự kiện với 3 phạm vi áp dụng: **Toàn bộ / Sản phẩm cụ thể / Danh mục**
- Logic tự động áp **mức giảm cao nhất** khi 1 sản phẩm thuộc nhiều sự kiện đồng thời
- Sửa lỗi nghiêm trọng: `bookIds`/`categoryIds` bị mất khi lưu do TypeScript interface thiếu trường

**Mã giảm giá — Coupon (Admin)**
- Backend CRUD Coupon hoàn chỉnh
- Giao diện Admin quản lý mã giảm giá với tìm kiếm và phân trang
- Tích hợp vào luồng thanh toán: kiểm tra điều kiện, tính giá cuối

**Phiếu nhập hàng (Admin)**
- Tìm kiếm theo tên nhà cung cấp hoặc mã phiếu nhập (ObjectId 24 ký tự)
- Khóa sửa phiếu đã xử lý; cập nhật tồn kho đúng khi chỉnh sửa
- Refactor MVC: chuyển toàn bộ logic truy vấn DB vào `ReceiptService.js`
- Hiển thị đầy đủ mã ID 24 ký tự để admin có thể copy và tìm kiếm chính xác

**Đánh giá — Review (Backend & Admin)**
- API Review CRUD cho user; kiểm duyệt (Duyệt/Ẩn) và thống kê sao cho admin
- Chỉ cho phép đánh giá từ đơn hàng đã hoàn thành
- Frontend quản lý đánh giá với upload ảnh review
- Module quản lý review trong Admin Dashboard

**Tìm kiếm trang Admin**
- Thanh tìm kiếm cho: Nhà cung cấp, Sự kiện, Phiếu nhập hàng
- Tìm kiếm qua Backend API (Mongoose `$regex`) với debounced 500ms
- Sửa lỗi SWR: wrap fetcher trong arrow function tránh SWR inject key làm tham số

**Tối ưu & Refactor**
- Chuyển toàn bộ Admin từ `useEffect + useState` sang `useSWR`
- Sửa lỗi đăng nhập account mới (bỏ double-hash password)
- Redirect về trang chủ khi URL sản phẩm thiếu ID
- Xóa `supplierId` khỏi model Book, cải thiện module thống kê
- Cấu hình môi trường và kết nối database ban đầu

---

## 🧪 Kế hoạch kiểm thử (Tương lai)

| Loại test | Mục tiêu |
|-----------|----------|
| Unit test (Vitest/Jest) | Kiểm tra các hàm service: `createEventService`, `getAllSupplyReceiptsService`, `getEffectiveBookPrice` |
| Integration test | Luồng end-to-end: tạo đơn → PayOS → webhook → cập nhật trạng thái |
| API test (Postman/Newman) | Chạy tự động Postman Collection trong CI/CD pipeline |
| E2E test (Playwright) | Luồng chính: đăng ký → thêm giỏ → áp mã giảm giá → thanh toán |
| Load test | Kiểm tra hiệu năng API `/api/books` với lượng dữ liệu lớn |