import "server-only";
import type { Order, OrderItem, OrderStatus } from "@/lib/db/schema";
import { bankConfig, orderTransferNote } from "@/lib/payments/vietqr";
import { site } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

/**
 * Transactional email through Resend's HTTP API (no SDK needed).
 * Without RESEND_API_KEY the message is printed to the server log instead,
 * so every flow still works locally.
 */
export async function sendEmail(message: { to: string; subject: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:dev] → ${message.to} · ${message.subject}`);
    return { ok: true as const, dev: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || `${site.name} <onboarding@resend.dev>`,
        to: [message.to],
        subject: message.subject,
        html: message.html,
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend error", res.status, await res.text());
      return { ok: false as const };
    }
    return { ok: true as const, dev: false };
  } catch (err) {
    console.error("[email] failed", err);
    return { ok: false as const };
  }
}

/* ------------------------------------------------------------------ */
/* Templates (inline styles: email clients ignore stylesheets)          */
/* ------------------------------------------------------------------ */

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f7f4ee;font-family:Helvetica,Arial,sans-serif;color:#1c1b19">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="padding:28px 32px;background:#1c1b19;color:#f7f4ee;font-family:Georgia,serif;font-size:26px;font-style:italic">${esc(site.name)}</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;font-size:28px">${esc(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:20px 32px;background:#f1ede5;font-size:12px;color:#77726a">${esc(site.name)} · ${esc(site.address)} · ${esc(site.email)}</td></tr>
</table></td></tr></table></body></html>`;
}

function orderUrl(order: Pick<Order, "code" | "email" | "locale">) {
  const prefix = order.locale === "en" ? "/en" : "";
  return `${site.url}${prefix}/track?code=${encodeURIComponent(order.code)}&contact=${encodeURIComponent(order.email)}`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;padding:14px 28px;border-radius:999px;background:#1c1b19;color:#ffffff;text-decoration:none;font-size:14px">${esc(label)}</a>`;
}

const STATUS_TEXT: Record<OrderStatus, { vi: string; en: string }> = {
  pending: { vi: "đang chờ xác nhận", en: "is awaiting confirmation" },
  confirmed: { vi: "đã được xác nhận và đang được đóng gói", en: "has been confirmed and is being packed" },
  shipping: { vi: "đang trên đường giao tới bạn", en: "is on its way to you" },
  delivered: { vi: "đã được giao thành công. Cảm ơn bạn!", en: "has been delivered. Thank you!" },
  cancelled: { vi: "đã bị hủy", en: "has been cancelled" },
};

export function orderConfirmationEmail(order: Order & { items: OrderItem[] }) {
  const vi = order.locale !== "en";
  const money = (n: number) => formatPrice(n, order.locale);
  const rows = order.items
    .map(
      (it) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid #eee">${esc(vi ? it.nameVi : it.nameEn)}<br><span style="font-size:12px;color:#77726a">${esc(vi ? it.colorNameVi : it.colorNameEn)} · ${esc(it.size)} × ${it.quantity}</span></td>
<td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right">${money(it.price * it.quantity)}</td></tr>`,
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 0;color:${bold ? "#1c1b19" : "#77726a"};${bold ? "font-weight:bold" : ""}">${label}</td><td style="padding:4px 0;text-align:right;${bold ? "font-weight:bold;font-size:18px" : ""}">${value}</td></tr>`;

  const bank = bankConfig();
  const bankBlock =
    order.paymentMethod === "bank"
      ? `<div style="margin-top:20px;padding:16px;border-radius:12px;background:#f7f4ee;font-size:14px">${
          bank
            ? `${vi ? "Chuyển khoản tới" : "Transfer to"}: <b>${esc(bank.bankName)}</b> · ${esc(bank.accountNumber)} · ${esc(bank.accountName)}<br>${vi ? "Nội dung" : "Reference"}: <b>${orderTransferNote(order.code)}</b>`
            : vi
              ? "Mở trang đơn hàng để quét mã VietQR thanh toán."
              : "Open your order page to scan the VietQR code."
        }</div>`
      : "";

  const html = layout(
    vi ? "Cảm ơn bạn đã đặt hàng!" : "Thanks for your order!",
    `<p style="margin:0 0 20px;line-height:1.6">${vi ? `Xin chào ${esc(order.customerName)}, đơn hàng` : `Hi ${esc(order.customerName)}, order`} <b>${esc(order.code)}</b> ${vi ? "đã được ghi nhận." : "has been received."}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;font-size:14px">
${line(vi ? "Tạm tính" : "Subtotal", money(order.subtotal))}
${line(vi ? "Phí giao hàng" : "Shipping", order.shippingFee ? money(order.shippingFee) : vi ? "Miễn phí" : "Free")}
${order.discount ? line(`${vi ? "Giảm giá" : "Discount"} (${esc(order.couponCode ?? "")})`, `−${money(order.discount)}`) : ""}
${line(vi ? "Tổng cộng" : "Total", money(order.total), true)}
</table>
${bankBlock}
<p style="margin:20px 0 0;font-size:14px;color:#77726a">${vi ? "Giao tới" : "Shipping to"}: ${esc(order.address)}, ${esc(order.city)}</p>
${button(orderUrl(order), vi ? "Theo dõi đơn hàng" : "Track your order")}`,
  );
  return { to: order.email, subject: vi ? `Xác nhận đơn hàng ${order.code}` : `Order ${order.code} confirmed`, html };
}

export function orderStatusEmail(order: Order) {
  const vi = order.locale !== "en";
  const text = STATUS_TEXT[order.status][vi ? "vi" : "en"];
  const html = layout(
    vi ? "Cập nhật đơn hàng" : "Order update",
    `<p style="margin:0;line-height:1.6">${vi ? "Đơn hàng" : "Your order"} <b>${esc(order.code)}</b> ${text}</p>${button(orderUrl(order), vi ? "Xem chi tiết" : "View details")}`,
  );
  return { to: order.email, subject: vi ? `Đơn ${order.code}: ${text}` : `Order ${order.code} ${text}`, html };
}

export function paymentReceivedEmail(order: Order) {
  const vi = order.locale !== "en";
  const html = layout(
    vi ? "Đã nhận thanh toán" : "Payment received",
    `<p style="margin:0;line-height:1.6">${vi ? "Chúng tôi đã nhận" : "We received"} <b>${formatPrice(order.total, order.locale)}</b> ${vi ? "cho đơn hàng" : "for order"} <b>${esc(order.code)}</b>.</p>${button(orderUrl(order), vi ? "Xem đơn hàng" : "View order")}`,
  );
  return { to: order.email, subject: vi ? `Đã nhận thanh toán đơn ${order.code}` : `Payment received for ${order.code}`, html };
}

export function resetPasswordEmail(to: string, name: string, url: string) {
  const html = layout(
    "Đặt lại mật khẩu · Reset your password",
    `<p style="margin:0;line-height:1.6">Xin chào ${esc(name)}, bấm nút bên dưới để đặt mật khẩu mới. Liên kết có hiệu lực trong 1 giờ.<br><span style="color:#77726a">Hi ${esc(name)}, use the button below to choose a new password. The link expires in 1 hour.</span></p>${button(url, "Đặt lại mật khẩu / Reset password")}`,
  );
  return { to, subject: "Đặt lại mật khẩu MÂY Studio", html };
}
