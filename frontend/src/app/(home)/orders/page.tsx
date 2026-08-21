"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import OrderItem from "@/components/order/OrderItem";
import { AddressSelectionDialog } from "@/components/order/AddressSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CheckoutAddressCard } from "./_components/CheckoutAddressCard";
import { OrderDetailsCard } from "./_components/OrderDetailsCard";
import { PaymentMethodCard } from "./_components/PaymentMethodCard";
import { OrderSummaryCard } from "./_components/OrderSummaryCard";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Banknote,
  CheckCircle,
  CreditCard,
  MapPin,
  Package,
  QrCode,
  Wallet,
} from "lucide-react";
import { getAllAddress } from "@/services/addressservices";
import { DialogCancelPayment } from "@/components/payment/DialogCancelPayment";
import { formatPrice } from "@/lib/utils";
import {
  ItemCart,
  OrderPayload,
  OrderPayloadSchema,
} from "@/validation/orderSchema";
import { Address } from "@/types/address.type";
import { Badge } from "@/components/ui/badge";
import { CreateAddressModal } from "@/components/address/create-address-modal-simple";
import { useCartStore } from "@/stores/useCartStore";
import { useProductDeletionMonitor } from "@/hooks/useProductDeletionMonitor";
import { bookServices } from "@/services/bookServices";
import { toast } from "sonner";
import { Order } from "@/types/order.type";
import { orderServices } from "@/services/orderServices";
import { createPayment } from "@/services/PaymentService";
import { useUser } from "@/services/authservices";
import { validateCoupon } from "@/services/couponService";
import { useAuthDialog } from "@/components/auth-dialog-context";
import router from "next/router";

const getLastAddressStorageKey = (userId?: string) =>
  userId ? `last_checkout_address_${userId}` : "last_checkout_address_guest";

const OrderPage = () => {
  const router = useRouter();
  const { setOpen: setAuthDialogOpen, setMode: setAuthDialogMode } = useAuthDialog();

  const { addresses, isLoading: addressLoading, mutate } = getAllAddress();

  // CHÚ THÍCH: Lấy dữ liệu giỏ hàng (cart) từ global state (Zustand).
  // Zustand giống như một "kho chứa dữ liệu chung" cho toàn bộ ứng dụng (Global State). 
  // Tại sao dùng Zustand thay vì gọi API (fetch) trực tiếp ở đây?
  // -> Vì thông tin giỏ hàng (số lượng, tổng tiền) cần được dùng ở rất nhiều nơi (như số hiển thị trên nút Giỏ hàng ở Header). 
  // -> Nếu trang nào cũng gọi API thì sẽ tốn tài nguyên và dữ liệu không đồng bộ. Dùng Zustand giúp lấy dữ liệu nhanh và khi giỏ hàng đổi thì Header cũng tự cập nhật theo ngay lập tức.
  const cart = useCartStore((s) => s.cart);
  const checkoutItems = useCartStore((s) => s.checkoutItems);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const cartLoading = useCartStore((s) => s.loading);
  const { user, isLoading: userLoading } = useUser();

  const [openCancel, setOpenCancel] = useState(false);
  const [openAddressDialog, setOpenAddressDialog] = useState(false);
  const [openCreateAddress, setOpenCreateAddress] = useState(false);
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [didInitCheckoutAddress, setDidInitCheckoutAddress] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // CHÚ THÍCH: Hook tự tạo (Custom Hook) dùng để theo dõi (Monitor).
  // Đang thanh toán mà Admin bỗng dưng xóa sản phẩm đó khỏi kho thì sao?
  // Hook này sẽ theo dõi liên tục, nếu phát hiện sản phẩm bị xóa, nó sẽ báo lỗi và đẩy user về lại trang Giỏ hàng.
  useProductDeletionMonitor();

  // CHÚ THÍCH: useEffect là một Hook cốt lõi của React, dùng để chạy những "hành động phụ" (Side effects).
  // useEffect sẽ chạy MỘT LẦN ngay khi giao diện vừa load xong, hoặc chạy lại khi các biến ở trong ngoặc vuông (Dependencies array) bị thay đổi.
  useEffect(() => {
    const validateCheckoutItems = async () => {
      if (!cart || cart.items.length === 0 || !checkoutItems || checkoutItems.length === 0) {
        return;
      }

      let hasDeletedItems = false;
      const deletedProducts: string[] = [];
      const itemsToCheckout = cart.items.filter((item) =>
        checkoutItems.includes(item._id)
      );

      // Check if all products in checkout still exist
      for (const item of itemsToCheckout) {
        try {
          await bookServices.getBookById(item.bookId);
        } catch (error: any) {
          if (error.status === 404 || error.status === 400) {
            hasDeletedItems = true;
            deletedProducts.push(item.bookId);
          }
        }
      }

      if (hasDeletedItems) {
        const productNames = deletedProducts.join(", ");
        toast.error(`Sản phẩm "${productNames}" đã bị xóa khỏi kho. Vui lòng kiểm tra lại giỏ hàng.`);

        // Refetch cart and redirect back to cart
        await fetchCart();
        setTimeout(() => {
          router.push("/cart");
        }, 2000);
      }
    };

    validateCheckoutItems();
  }, [cart, checkoutItems, fetchCart, router]);

  // CHÚ THÍCH: Nếu user chưa đăng nhập, tự động bật Hộp thoại yêu cầu Đăng nhập.
  // Auto-open auth dialog when user tries to checkout without login
  useEffect(() => {
    if (!userLoading && !user) {
      setAuthDialogMode('login');
      setAuthDialogOpen(true);
    }
  }, [user, userLoading, setAuthDialogOpen, setAuthDialogMode]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // CHÚ THÍCH: Khởi tạo form bằng useForm (React Hook Form) kết hợp với Zod (zodResolver).
  // - useForm: Quản lý toàn bộ dữ liệu người dùng gõ vào form cực nhanh mà không làm màn hình bị giật (re-render).
  // - zodResolver: Tạo ra cái khiên bảo vệ, ép người dùng phải nhập đúng quy tắc (ví dụ: Tên không được rỗng) trước khi cho bấm Thanh toán.
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<OrderPayload>({
    resolver: zodResolver(OrderPayloadSchema),
    defaultValues: {
      details: [],
      receiverName: "",
      receiverPhone: "",
      receiverAddress: "",
      paymentMethod: "COD",
    },
  });

//  Hàm watch() của react-hook-form giúp ta "nhìn lén" xem người dùng đang gõ gì vào ô input, 
// từ đó ta gán vào biến (ví dụ receiverName) để truyền xuống dưới thẻ Component con hiển thị.
const receiverName = watch("receiverName");
const receiverPhone = watch("receiverPhone");
const receiverAddress = watch("receiverAddress");

useEffect(() => {
  if (cart && cart.items.length > 0) {
    // Filter items to only include selected ones for checkout
    const itemsToCheckout =
      checkoutItems && checkoutItems.length > 0
        ? cart.items.filter((item) => checkoutItems.includes(item._id))
        : cart.items;

    const formItems: ItemCart[] = itemsToCheckout.map((item) => ({
      bookId: item.bookId,
      quantity: item.quantity,
      price: item.price,
    }));
    setValue("details", formItems, { shouldValidate: true });
  } else if (cart && cart.items.length === 0) {
    router.push("/");
  }
}, [cart, checkoutItems, setValue, router]);
useEffect(() => {
  if (!addresses || addresses.length === 0 || didInitCheckoutAddress) {
    return;
  }

  // Only auto-select once and only when shipping address is still empty.
  if (getValues("receiverAddress")) {
    setDidInitCheckoutAddress(true);
    return;
  }

  const defaultAddr =
    addresses.find((addr: Address) => addr.isDefault) || addresses[0];

  if (defaultAddr) {
    fillAddressToForm(defaultAddr);
    if (defaultAddr._id && typeof window !== "undefined") {
      window.localStorage.setItem(
        getLastAddressStorageKey(user?.data?._id),
        defaultAddr._id,
      );
    }
  }

  setDidInitCheckoutAddress(true);
}, [addresses, didInitCheckoutAddress, getValues, user?.data?._id]);

useEffect(() => {
  const profile = user?.data;
  if (!profile) return;

  if (!getValues("receiverName") && profile.fullName) {
    setValue("receiverName", profile.fullName, { shouldValidate: true });
  }
  if (!getValues("receiverPhone") && profile.phone) {
    setValue("receiverPhone", profile.phone, { shouldValidate: true });
  }
}, [user, getValues, setValue]);

const fillAddressToForm = (addr: Address) => {
  const fullAddress = `${addr.detail}, ${addr.district}, ${addr.province}`;
  const profile = user?.data;

  setValue("receiverName", profile?.fullName || addr.name, {
    shouldValidate: true,
  });
  setValue("receiverPhone", profile?.phone || addr.phone, {
    shouldValidate: true,
  });
  setValue("receiverAddress", fullAddress, { shouldValidate: true });
  setIsDefaultAddress(Boolean(addr.isDefault));
};

const handleSelectAddress = (addr: Address) => {
  if (addr._id && typeof window !== "undefined") {
    window.localStorage.setItem(
      getLastAddressStorageKey(user?.data?._id),
      addr._id,
    );
  }
  fillAddressToForm(addr);
  setOpenAddressDialog(false);
};

const handleSuccessCreateAddr = async (addr: Address) => {
  setOpenCreateAddress(false);
  await mutate();
  if (addr._id && typeof window !== "undefined") {
    window.localStorage.setItem(
      getLastAddressStorageKey(user?.data?._id),
      addr._id,
    );
  }
  fillAddressToForm(addr);
};

const onSubmit = async (data: OrderPayload) => {
  try {
    if (data.paymentMethod === "CARD") {
      toast.info(
        "Chức năng chưa được hỗ trợ. Vui lòng chọn phương thức thanh toán khác!",
      );
      return;
    }

    // Validate that all items in the order still exist in cart
    if (!data.details || data.details.length === 0) {
      toast.error("Giỏ hàng của bạn trống. Vui lòng quay lại trang giỏ hàng.");
      router.push("/cart");
      return;
    }

    // Kiểm tra lại lần cuối trước khi tạo đơn xem các sản phẩm trong giỏ còn đủ số lượng không
    for (const orderItem of data.details) {
      const cartItem = cart?.items.find(item => item.bookId === orderItem.bookId);
      if (!cartItem) {
        toast.error(
          `Sản phẩm không còn tồn tại trong giỏ hàng. Vui lòng kiểm tra lại.`,
        );
        await fetchCart();
        return;
      }
      if (cartItem.quantity < orderItem.quantity) {
        toast.error(
          `Số lượng sản phẩm "${orderItem.bookId}" không đủ. Vui lòng kiểm tra lại.`,
        );
        await fetchCart();
        return;
      }
    }

    // Gọi API tạo đơn hàng mới trên hệ thống
    const payload: OrderPayload = {
      ...data,
      couponCode: appliedCouponCode || undefined,
    };
    const res: Order = await orderServices.createOrder(payload);

    // Xử lý luồng thanh toán dựa trên phương thức người dùng chọn
    if (res.paymentMethod === "MOMO") {
      const paymentRes = await createPayment(res._id);
      if (!paymentRes?.ok) {
        const errorMessage =
          paymentRes && "message" in paymentRes
            ? paymentRes.message
            : "Không thể tạo thanh toán MoMo";
        toast.error(errorMessage);
        return;
      }
      const isMobile =
        typeof navigator !== "undefined" &&
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const paymentUrl = isMobile
        ? paymentRes?.payment?.deeplink || paymentRes?.payment?.paymentUrl
        : paymentRes?.payment?.paymentUrl || paymentRes?.payment?.deeplink;
      const qrCodeUrl = paymentRes?.payment?.qrCodeUrl;
      if (!paymentUrl) {
        if (qrCodeUrl) {
          toast.info(
            "MoMo đang tạm lỗi, hệ thống chuyển sang thanh toán QR chuyển khoản.",
          );
          router.push(`/payment/transfer/${res._id}`);
          return;
        }
        toast.error("Không tạo được link thanh toán MoMo");
        return;
      }
      toast.success("Đang chuyển sang cổng thanh toán MoMo...");
      window.location.href = paymentUrl;
      return;
    } else if (res.paymentMethod === "PAYOS") {
      const paymentRes = await createPayment(res._id);
      if (!paymentRes?.ok) {
        const errorMessage =
          paymentRes && "message" in paymentRes
            ? paymentRes.message
            : "Không thể tạo thanh toán";
        toast.error(errorMessage);
        return;
      }
      toast.success("Vui lòng quét mã QR để thanh toán.");
      router.push(`/payment/transfer/${res._id}`);
    } else if (res.paymentMethod === "COD") {
      router.push(`/orders/${res._id}`);
      toast.success("Đặt hàng thành công!");
    }
  } catch (error: any) {
    console.error(error);
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Có lỗi xảy ra khi tạo đơn hàng";
    toast.error(message);
  }
};

if ((!cart && cartLoading) || addressLoading)
  return <div className="text-center p-10">Loading...</div>;

// If not authenticated, auth dialog will open globally via useEffect
// No need to show anything here
if (!user) {
  return null;
}

if (!cart) return null;

// Filter items to only show selected ones for checkout
const displayItems =
  checkoutItems && checkoutItems.length > 0
    ? cart.items.filter((item) => checkoutItems.includes(item._id))
    : cart.items;

// Calculate total for displayed items only
const displayTotal = displayItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0,
);
const finalTotal = Math.max(0, displayTotal - discountAmount);

const handleApplyCoupon = async () => {
  const code = couponCode.trim();
  if (!code) {
    toast.error("Vui lòng nhập mã giảm giá");
    return;
  }

  try {
    setIsApplyingCoupon(true);
    const response = await validateCoupon(code, displayTotal);
    if (!response?.ok || !response?.coupon) {
      toast.error("Mã giảm giá không hợp lệ");
      return;
    }

    setAppliedCouponCode(response.coupon.code);
    setDiscountAmount(response.coupon.discountAmount || 0);
    toast.success(
      `Áp mã thành công, giảm ${formatPrice(response.coupon.discountAmount || 0)}`,
    );
  } catch (error: any) {
    const message =
      error?.response?.data?.message || "Không áp dụng được mã giảm giá";
    toast.error(message);
    setAppliedCouponCode("");
    setDiscountAmount(0);
  } finally {
    setIsApplyingCoupon(false);
  }
};

const handleRemoveCoupon = () => {
  setCouponCode("");
  setAppliedCouponCode("");
  setDiscountAmount(0);
};

return (
  <div className="min-h-screen bg-gray-50/50 py-8 px-4 md:px-6">
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpenCancel(true)}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <DialogCancelPayment
          open={openCancel}
          onOpenChange={setOpenCancel}
          onConfirm={() => router.push("/")}
        />
        <h1 className="text-2xl font-bold text-gray-900">
          Thanh toán đơn hàng
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit, (err) => console.log(err))}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative"
      >
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Address Section */}
          <CheckoutAddressCard
            receiverAddress={receiverAddress}
            receiverName={receiverName}
            receiverPhone={receiverPhone}
            isDefaultAddress={isDefaultAddress}
            errors={errors}
            onOpenAddressDialog={() => setOpenAddressDialog(true)}
          />

          <OrderDetailsCard
            displayItems={displayItems}
            errorsDetails={errors.details}
          />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 space-y-4">

            {/* Payment Method */}
            <PaymentMethodCard control={control} />

            {/* Total, Coupon & Submit */}
            <OrderSummaryCard
              displayTotal={displayTotal}
              finalTotal={finalTotal}
              isSubmitting={isSubmitting}
              couponCode={couponCode}
              appliedCouponCode={appliedCouponCode}
              discountAmount={discountAmount}
              isApplyingCoupon={isApplyingCoupon}
              setCouponCode={setCouponCode}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
            />

          </div>
        </div>
      </form>

      <AddressSelectionDialog
        open={openAddressDialog}
        onOpenChange={setOpenAddressDialog}
        onSelect={handleSelectAddress}
        onAddNew={() => setOpenCreateAddress(true)}
      />
      {openCreateAddress && (
        <CreateAddressModal
          isOpen={openCreateAddress}
          onClose={() => setOpenCreateAddress(false)}
          initialData={null}
          onSuccess={handleSuccessCreateAddr}
        />
      )}
    </div>
  </div>
);
};

export default OrderPage;
