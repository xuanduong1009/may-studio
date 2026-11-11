import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { imageIdFromUrl, isImageId, sniffImageType } from "@/lib/images";
import { productSchema } from "@/lib/validators";

const bytes = (...b: number[]) => new Uint8Array(b);
const text = (s: string) => new TextEncoder().encode(s);

describe("uploaded image checks", () => {
  it("recognises JPEG, PNG and WebP from their bytes", () => {
    assert.equal(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0)), "image/jpeg");
    assert.equal(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0)), "image/png");
    assert.equal(sniffImageType(text("RIFF\u0000\u0000\u0000\u0000WEBPVP8 ")), "image/webp");
  });
  it("rejects everything else, whatever the browser claims", () => {
    assert.equal(sniffImageType(text('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')), null);
    assert.equal(sniffImageType(text("<!doctype html><html>")), null);
    assert.equal(sniffImageType(text("GIF89a")), null);
    assert.equal(sniffImageType(bytes()), null);
  });
  it("reads upload ids from URLs", () => {
    assert.equal(imageIdFromUrl("/api/images/AbCdEfGh_-123456"), "AbCdEfGh_-123456");
    assert.equal(imageIdFromUrl("/api/images/short"), null);
    assert.equal(imageIdFromUrl("/images/pexels/123.jpg"), null);
    assert.equal(imageIdFromUrl(null), null);
    assert.equal(isImageId("../../etc/passwd"), false);
  });
});

describe("product photo gallery validation", () => {
  const product = {
    nameVi: "Áo", nameEn: "Tee", slug: "ao", descriptionVi: "", descriptionEn: "", price: 200_000, compareAtPrice: null,
    categoryId: 1, kind: "tee", colors: [{ nameVi: "Đen", nameEn: "Black", hex: "#1c1c1c" }], sizes: ["M"],
    variants: [{ colorHex: "#1c1c1c", size: "M", stock: 5 }], featured: false, isNew: false, imageUrl: null,
  };
  const withPhotos = (images: { url: string; colorHex: string | null }[]) => productSchema.safeParse({ ...product, images }).success;

  it("accepts uploads and bundled photos, per colour or shared", () => {
    assert.equal(withPhotos([{ url: "/api/images/AbCdEfGh_-123456", colorHex: "#1C1C1C" }, { url: "/images/pexels/17858295.jpg", colorHex: null }]), true);
  });
  it("defaults to no photos", () => {
    const r = productSchema.safeParse(product);
    assert.deepEqual(r.success && r.data.images, []);
  });
  it("rejects photos hosted elsewhere or tied to a colour the product does not have", () => {
    assert.equal(withPhotos([{ url: "https://evil.example/x.jpg", colorHex: null }]), false);
    assert.equal(withPhotos([{ url: "//evil.example/x.jpg", colorHex: null }]), false);
    assert.equal(withPhotos([{ url: "/images/../secret.jpg", colorHex: null }]), false);
    assert.equal(withPhotos([{ url: "/api/images/AbCdEfGh_-123456", colorHex: "#ffffff" }]), false);
  });
});
