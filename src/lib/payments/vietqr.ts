/**
 * VietQR (NAPAS 247) payload builder, following the EMVCo merchant-presented
 * QR spec. Any Vietnamese banking app can scan the result and gets the
 * account, amount and transfer note pre-filled.
 */

function tlv(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF), as required by EMVCo. */
export function crc16(input: string) {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Keeps only characters every bank accepts in a transfer note. */
export function toTransferNote(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .slice(0, 50);
}

export function buildVietQrPayload(input: { bin: string; accountNumber: string; amount?: number; note?: string }) {
  const account = tlv("00", input.bin) + tlv("01", input.accountNumber);
  const merchant = tlv("00", "A000000727") + tlv("01", account) + tlv("02", "QRIBFTTA");
  const amount = input.amount && input.amount > 0 ? Math.round(input.amount) : 0;
  const note = input.note ? toTransferNote(input.note) : "";

  let payload =
    tlv("00", "01") +
    tlv("01", amount ? "12" : "11") +
    tlv("38", merchant) +
    tlv("53", "704") +
    (amount ? tlv("54", String(amount)) : "") +
    tlv("58", "VN") +
    (note ? tlv("62", tlv("08", note)) : "");
  payload += "6304";
  return payload + crc16(payload);
}

export type BankConfig = { bin: string; accountNumber: string; accountName: string; bankName: string };

/** Reads the shop's bank account from env. Returns null in demo mode. */
export function bankConfig(): BankConfig | null {
  const bin = process.env.BANK_BIN?.trim();
  const accountNumber = process.env.BANK_ACCOUNT_NO?.trim();
  if (!bin || !accountNumber || !/^\d{6}$/.test(bin)) return null;
  return {
    bin,
    accountNumber,
    accountName: process.env.BANK_ACCOUNT_NAME?.trim() ?? "",
    bankName: process.env.BANK_NAME?.trim() || bin,
  };
}

/**
 * Demo bank transfer (a QR that only opens the order page, plus a "simulate
 * transfer" button) is for local development only. In production nobody may
 * mark an order paid without actually paying.
 */
export function bankDemoMode() {
  return !bankConfig() && process.env.NODE_ENV !== "production";
}

/** Bank transfer is offered once the shop's account is configured (or in local demo mode). */
export function bankTransferEnabled() {
  return !!bankConfig() || bankDemoMode();
}

/** Transfer note for an order: the code without the dash, which banks often strip. */
export function orderTransferNote(code: string) {
  return code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/** Finds an order code (MAY + 8 characters) inside a bank transaction description. */
export function extractOrderCode(description: string) {
  const m = description.toUpperCase().match(/MAY-?([0-9A-Z]{8})/);
  return m ? `MAY-${m[1]}` : null;
}
