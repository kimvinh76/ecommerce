import { redirect } from 'next/navigation';

export default function ProductRootPage() {
  // Tự động chuyển hướng về trang chủ khi khách hàng gõ thiếu ID sản phẩm
  redirect('/'); 
}
