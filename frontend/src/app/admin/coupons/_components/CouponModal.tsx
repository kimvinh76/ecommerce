import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coupon, CouponPayload, createCoupon, updateCoupon } from "@/services/couponService";

const schema = z.object({
  code: z.string().min(1, "Vui lòng nhập mã giảm giá").trim().toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.coerce.number().min(0, "Mức giảm phải >= 0"),
  minOrderValue: z.coerce.number().min(0, "Giá trị đơn tối thiểu >= 0").optional(),
  maxDiscount: z.coerce.number().min(0, "Giảm tối đa >= 0").optional(),
  usageLimit: z.coerce.number().min(0, "Giới hạn sử dụng >= 0").optional(),
  startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
  isActive: z.boolean(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "Ngày kết thúc phải lớn hơn ngày bắt đầu",
  path: ["endDate"],
});

type FormValues = z.infer<typeof schema>;

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon | null;
  onSuccess: () => void;
}

const formatDateForInput = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16); // "YYYY-MM-DDThh:mm"
};

export default function CouponModal({ isOpen, onClose, coupon, onSuccess }: CouponModalProps) {
  const isEditing = !!coupon;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      code: "",
      description: "",
      discountType: "percent",
      discountValue: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      usageLimit: 0,
      startDate: "",
      endDate: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (coupon) {
        form.reset({
          code: coupon.code,
          description: coupon.description || "",
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderValue: coupon.minOrderValue || 0,
          maxDiscount: coupon.maxDiscount || 0,
          usageLimit: coupon.usageLimit || 0,
          startDate: formatDateForInput(coupon.startDate),
          endDate: formatDateForInput(coupon.endDate),
          isActive: coupon.isActive,
        });
      } else {
        form.reset({
          code: "",
          description: "",
          discountType: "percent",
          discountValue: 0,
          minOrderValue: 0,
          maxDiscount: 0,
          usageLimit: 0,
          startDate: "",
          endDate: "",
          isActive: true,
        });
      }
    }
  }, [isOpen, coupon, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: CouponPayload = {
        ...values,
      };

      if (isEditing && coupon?._id) {
        await updateCoupon(coupon._id, payload);
        toast.success("Cập nhật mã giảm giá thành công");
      } else {
        await createCoupon(payload);
        toast.success("Tạo mã giảm giá thành công");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Chỉnh sửa mã giảm giá" : "Thêm mã giảm giá mới"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã Code (Tự động in hoa)</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: TET2024" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-8 h-10">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Đang hoạt động</FormLabel>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả (Tùy chọn)</FormLabel>
                  <FormControl>
                    <Input placeholder="Mô tả cho khách hàng dễ hiểu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại giảm giá</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại giảm" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percent">Giảm theo %</SelectItem>
                        <SelectItem value="fixed">Giảm tiền mặt (đ)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Mức giảm {form.watch("discountType") === "percent" ? "(%)" : "(đ)"}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minOrderValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đơn tối thiểu (đ)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxDiscount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giảm tối đa (đ) - Dành cho %</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} disabled={form.watch("discountType") === "fixed"} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="usageLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số lượt dùng tối đa (0 = Không giới hạn)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời gian bắt đầu</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời gian kết thúc</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Đang lưu..." : "Lưu mã giảm giá"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
