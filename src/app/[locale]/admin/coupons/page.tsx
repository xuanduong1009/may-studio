import { setRequestLocale } from "next-intl/server";
import { CouponManager } from "@/components/admin/coupon-manager";
import { asLocale } from "@/i18n/routing";
import { getAdminCoupons } from "@/lib/server/queries/admin";

export default async function AdminCoupons({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(asLocale((await params).locale));
  const coupons = await getAdminCoupons();
  return <CouponManager coupons={coupons} now={Date.now()} />;
}
