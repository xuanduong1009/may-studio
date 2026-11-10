import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildVietQrPayload, crc16, extractOrderCode, orderTransferNote, toTransferNote } from "@/lib/payments/vietqr";
import { buildVnpayUrl, codeToTxnRef, signVnpParams, txnRefToCode, verifyVnpayParams, vnpDate } from "@/lib/payments/vnpay";

describe("VietQR", () => {
  it("uses CRC-16/CCITT-FALSE", () => {
    // standard check value for this CRC variant
    assert.equal(crc16("123456789"), "29B1");
  });

  it("builds a valid EMVCo payload", () => {
    const payload = buildVietQrPayload({ bin: "970436", accountNumber: "0123456789", amount: 590_000, note: "MAY7KQ2X9HD" });
    assert.ok(payload.startsWith("000201010212"), "dynamic QR header");
    assert.ok(payload.includes("0010A000000727"), "NAPAS GUID");
    assert.ok(payload.includes("0006970436"), "bank BIN");
    assert.ok(payload.includes("01100123456789"), "account number");
    assert.ok(payload.includes("5303704"), "currency VND");
    assert.ok(payload.includes("5406590000"), "amount");
    assert.ok(payload.includes("5802VN"), "country");
    assert.ok(payload.includes("62150811MAY7KQ2X9HD"), "transfer note");
    // the last 4 characters are the CRC of everything before them
    assert.equal(payload.slice(-4), crc16(payload.slice(0, -4)));
  });

  it("makes a static QR when there is no amount", () => {
    const payload = buildVietQrPayload({ bin: "970436", accountNumber: "0123456789" });
    assert.ok(payload.startsWith("000201010211"));
    assert.ok(!payload.includes("5406"));
  });

  it("strips characters banks reject from the note", () => {
    assert.equal(toTransferNote("Thanh toán đơn MAY-7KQ2X9HD!"), "Thanh toan don MAY7KQ2X9HD");
    assert.equal(orderTransferNote("MAY-7KQ2X9HD"), "MAY7KQ2X9HD");
  });

  it("finds the order code in a bank statement line", () => {
    assert.equal(extractOrderCode("MBVCB.123456.MAY7KQ2X9HD.CT tu 0123 toi 9876"), "MAY-7KQ2X9HD");
    assert.equal(extractOrderCode("chuyen tien may-7kq2x9hd"), "MAY-7KQ2X9HD");
    assert.equal(extractOrderCode("tien nha thang 11"), null);
  });
});

describe("VNPay", () => {
  const config = { tmnCode: "TESTCODE", hashSecret: "SECRETKEY123", payUrl: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html" };

  it("formats dates in Vietnam time", () => {
    assert.equal(vnpDate(new Date("2026-01-01T17:30:05Z")), "20260102003005");
  });

  it("round-trips order codes through vnp_TxnRef", () => {
    assert.equal(codeToTxnRef("MAY-7KQ2X9HD"), "MAY7KQ2X9HD");
    assert.equal(txnRefToCode("MAY7KQ2X9HD"), "MAY-7KQ2X9HD");
    assert.equal(txnRefToCode("12345"), null);
  });

  it("signs a payment URL that verifies after URL decoding", () => {
    const url = buildVnpayUrl(config, {
      txnRef: "MAY7KQ2X9HD",
      amount: 531_000,
      orderInfo: "Thanh toan don hang MAY7KQ2X9HD",
      ipAddr: "127.0.0.1",
      returnUrl: "http://localhost:3000/api/payments/vnpay/return",
      locale: "vi",
      now: new Date("2026-11-09T03:00:00Z"),
    });
    const params = Object.fromEntries(new URL(url).searchParams.entries());
    assert.equal(params.vnp_Amount, "53100000");
    assert.equal(params.vnp_Locale, "vn");
    assert.equal(params.vnp_CreateDate, "20261109100000");
    assert.equal(params.vnp_ExpireDate, "20261109101500");
    assert.equal(verifyVnpayParams(params, config.hashSecret), true);
  });

  it("rejects tampered or unsigned callbacks", () => {
    const params = { vnp_Amount: "53100000", vnp_ResponseCode: "00", vnp_TxnRef: "MAY7KQ2X9HD", vnp_TransactionStatus: "00" };
    const { hash } = signVnpParams(params, config.hashSecret);
    assert.equal(verifyVnpayParams({ ...params, vnp_SecureHash: hash }, config.hashSecret), true);
    assert.equal(verifyVnpayParams({ ...params, vnp_Amount: "100", vnp_SecureHash: hash }, config.hashSecret), false);
    assert.equal(verifyVnpayParams({ ...params, vnp_SecureHash: hash }, "WRONGSECRET"), false);
    assert.equal(verifyVnpayParams(params, config.hashSecret), false);
  });
});
