import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * VNPay payment gateway (API v2.1.0). Enabled when VNPAY_TMN_CODE and
 * VNPAY_HASH_SECRET are set; free sandbox credentials are available at
 * https://sandbox.vnpayment.vn/devreg/
 */
export function vnpayConfig() {
  const tmnCode = process.env.VNPAY_TMN_CODE?.trim();
  const hashSecret = process.env.VNPAY_HASH_SECRET?.trim();
  if (!tmnCode || !hashSecret) return null;
  return {
    tmnCode,
    hashSecret,
    payUrl: process.env.VNPAY_URL?.trim() || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  };
}

function encode(value: string) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

/** Sorted, encoded query string and its HMAC-SHA512 signature. */
export function signVnpParams(params: Record<string, string>, secret: string) {
  const query = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== "")
    .sort()
    .map((k) => `${encode(k)}=${encode(params[k])}`)
    .join("&");
  const hash = createHmac("sha512", secret).update(Buffer.from(query, "utf-8")).digest("hex");
  return { query, hash };
}

/** yyyyMMddHHmmss in Vietnam time (GMT+7), as VNPay expects. */
export function vnpDate(date: Date) {
  const d = new Date(date.getTime() + 7 * 3600_000);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

export function buildVnpayUrl(
  config: { tmnCode: string; hashSecret: string; payUrl: string },
  input: { txnRef: string; amount: number; orderInfo: string; ipAddr: string; returnUrl: string; locale: string; now?: Date },
) {
  const now = input.now ?? new Date();
  const params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: config.tmnCode,
    vnp_Locale: input.locale === "vi" ? "vn" : "en",
    vnp_CurrCode: "VND",
    vnp_TxnRef: input.txnRef,
    vnp_OrderInfo: input.orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: String(Math.round(input.amount) * 100),
    vnp_ReturnUrl: input.returnUrl,
    vnp_IpAddr: input.ipAddr,
    vnp_CreateDate: vnpDate(now),
    vnp_ExpireDate: vnpDate(new Date(now.getTime() + 15 * 60_000)),
  };
  const { query, hash } = signVnpParams(params, config.hashSecret);
  return `${config.payUrl}?${query}&vnp_SecureHash=${hash}`;
}

/** Checks the signature VNPay puts on the return URL and IPN calls. */
export function verifyVnpayParams(query: Record<string, string>, secret: string) {
  const received = (query.vnp_SecureHash ?? "").toLowerCase();
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(query)) {
    if (k.startsWith("vnp_") && k !== "vnp_SecureHash" && k !== "vnp_SecureHashType") params[k] = v;
  }
  const { hash } = signVnpParams(params, secret);
  const a = Buffer.from(hash, "utf-8");
  const b = Buffer.from(received, "utf-8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** VNPay only allows letters and digits in vnp_TxnRef, so the dash is dropped. */
export function codeToTxnRef(code: string) {
  return code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function txnRefToCode(txnRef: string) {
  const m = txnRef.toUpperCase().match(/^MAY([0-9A-Z]+)$/);
  return m ? `MAY-${m[1]}` : null;
}
