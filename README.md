# Superbook - Nền tảng Bán sách Trực tuyến

Hệ thống thương mại điện tử chuyên bán sách được xây dựng bằng Node.js và React.js, cung cấp các chức năng quản lý sản phẩm, đơn hàng, người dùng và thanh toán trực tuyến.

## Công nghệ sử dụng

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose (CSDL)
- JWT (Xác thực)
- Cloudinary (Lưu trữ hình ảnh)
- PayOS (Thanh toán)

**Frontend:**
- React.js + Next.js
- TypeScript
- Tailwind CSS

## Chức năng chính

**Quản lý Sản phẩm**
- Thêm, chỉnh sửa, xóa sách
- Phân loại sách (danh mục)
- Quản lý tác giả, nhà xuất bản
- Quản lý nhà cung cấp và chi tiết nhập hàng

**Quản lý Đơn hàng**
- Tạo đơn hàng
- Theo dõi trạng thái đơn hàng
- Quản lý chi tiết đơn hàng

**Quản lý Người dùng**
- Đăng ký, đăng nhập
- Quản lý thông tin cá nhân
- Quản lý địa chỉ giao hàng
- Phân quyền (Admin, User)

**Giỏ hàng và Thanh toán**
- Thêm, xóa sản phẩm trong giỏ hàng
- Thanh toán qua Momo (Sandbox)
- Xử lý thanh toán tự động

**Các chức năng khác**
- Hệ thống mã giảm giá (Coupon)
- Đánh giá và nhận xét sản phẩm
- Quản lý sự kiện khuyến mại
- Tính năng tìm kiếm sản phẩm
- Thống kê doanh số

## Cài đặt

### Yêu cầu
- Node.js >= 18.x
- MongoDB >= 6.x
- npm hoặc yarn

### Backend

1. Di chuyển vào thư mục backend:
```bash
cd backend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Cấu hình biến môi trường (copy từ example.env):
```bash
cp example.env .env
```

4. Chạy server:
```bash
# Chế độ phát triển
npm run dev

# Chế độ production
npm start
```

Server chạy tại: `http://localhost:3000`

### Frontend

1. Di chuyển vào thư mục frontend:
```bash
cd frontend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Chạy ứng dụng:
```bash
npm run dev
```

Frontend chạy tại: `http://localhost:3001`

## Cấu hình Thanh toán Momo

Thanh toán được tích hợp với Momo Sandbox để test:

1. Cấu hình trong file `.env` (backend):
```
PAYOS_MERCHANT_ID=your_merchant_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
```

2. Momo Sandbox URL: `https://sandbox.momoapi.ngan.vn`

3. Tài khoản test Momo:
   - Phone: 0987654321
   - Password: 123456

## Cấu trúc dự án

```
Super_Book/
├── backend/                    # API backend
│   ├── src/
│   │   ├── config/            # Cấu hình (DB, Cloudinary, PayOS, Email)
│   │   ├── controllers/       # Xử lý logic của các API
│   │   ├── models/            # Mô hình CSDL MongoDB
│   │   ├── routes/            # Định tuyến API
│   │   ├── services/          # Tầng dịch vụ
│   │   ├── middlewares/       # Middleware (xác thực, phân quyền, xử lý lỗi)
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── mappers/           # Chuyển đổi dữ liệu
│   │   ├── helper/            # Hàm tiện ích
│   │   ├── utils/             # Công cụ hỗ trợ
│   │   └── server.js          # Entry point
│   └── package.json
│
├── frontend/                   # Ứng dụng React
│   ├── src/
│   │   ├── app/              # Các trang chính
│   │   ├── components/       # Các component tái sử dụng
│   │   ├── api/              # Gọi API
│   │   ├── hooks/            # React hooks tùy chỉnh
│   │   ├── stores/           # State management
│   │   ├── types/            # Định nghĩa kiểu dữ liệu
│   │   ├── utils/            # Hàm tiện ích
│   │   ├── constants/        # Hằng số
│   │   └── validation/       # Xác thực dữ liệu
│   └── package.json
│
├── documents/                 # Tài liệu dự án
│   ├── bookstore-function.md
│   ├── bookstore-project-plan.md
│   └── classDiagram.puml
│
└── README.md
```

## API Documentation

Danh sách các API endpoint chính được định nghĩa tại: [API_TEST_DOCUMENTATION.md](API_TEST_DOCUMENTATION.md)

Import Postman Collection: [BookStore_API.postman_collection.json](BookStore_API.postman_collection.json)

## Các API chính

- `/api/auth` - Xác thực (đăng ký, đăng nhập)
- `/api/users` - Quản lý người dùng
- `/api/books` - Quản lý sách
- `/api/categories` - Quản lý danh mục
- `/api/authors` - Quản lý tác giả
- `/api/publishers` - Quản lý nhà xuất bản
- `/api/suppliers` - Quản lý nhà cung cấp
- `/api/cart` - Quản lý giỏ hàng
- `/api/orders` - Quản lý đơn hàng
- `/api/payment` - Xử lý thanh toán
- `/api/coupons` - Quản lý mã giảm giá
- `/api/reviews` - Quản lý đánh giá
- `/api/addresses` - Quản lý địa chỉ
- `/api/events` - Quản lý sự kiện
- `/api/statistics` - Thống kê doanh số


##  Công nghệ & Thư viện

### Backend
- **express**: ^5.1.0 - Web framework
- **mongoose**: ^8.18.0 - MongoDB ODM
- **dotenv**: ^16.6.1 - Environment variables
- **nodemon**: ^3.1.0 - Auto-reload trong development

### Frontend
- **next**: ^15.5.7 - Framework React cho giao diện web
- **react**: 19.1.0 - UI library
- **typescript**: ^5 - Kiểu dữ liệu tĩnh
- **tailwindcss**: ^4 - Thiết kế giao diện
- **zustand**: ^5.0.9 - Quản lý trạng thái
- **swr**: ^2.3.6 - Fetch và cache dữ liệu
- **react-hook-form**: ^7.64.0 - Quản lý form
- **zod**: ^4.1.11 - Validate dữ liệu
- **axios**: ^1.12.2 - Gọi API
- **sonner** / **react-hot-toast** / **react-toastify** - Thông báo giao diện

### Frontend chức năng hiện có
- Trang giao diện bán sách cơ bản
- Hiển thị danh sách và chi tiết sản phẩm
- Giỏ hàng và luồng đặt hàng
- Đăng nhập, đăng ký và quản lý thông tin người dùng
- Màn hình thanh toán và thông báo kết quả giao dịch



### Collections chính:
- **Users**: Quản lý người dùng
- **Books**: Quản lý sách
- **Categories**: Danh mục sách
- **Orders**: Đơn hàng
- **Reviews**: Đánh giá sách



