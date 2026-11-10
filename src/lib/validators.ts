import { z } from "zod";
import { GARMENT_KINDS } from "@/components/product/garment-art";
import { COUPON_TYPES, PAYMENT_METHODS, REVIEW_FITS } from "@/lib/constants";

const phone = z
  .string()
  .trim()
  .regex(/^(\+?84|0)(3|5|7|8|9)\d{8}$/, "phone");

/** Error messages are translation keys under Checkout.errors */
export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "name").max(80, "name"),
  phone,
  email: z.string().trim().email("email").max(120, "email"),
  address: z.string().trim().min(5, "address").max(200, "address"),
  city: z.string().trim().min(2, "city").max(60, "city"),
  note: z.string().trim().max(300).optional().or(z.literal("")),
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(PAYMENT_METHODS),
  couponCode: z.string().trim().max(30).optional().nullable(),
  saveAddress: z.boolean().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const orderItemsSchema = z
  .array(
    z.object({
      productId: z.number().int().positive(),
      colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      size: z.string().min(1).max(10),
      quantity: z.number().int().min(1).max(20),
    }),
  )
  .min(1)
  .max(50);

const hex = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/);

export const productSchema = z
  .object({
    nameVi: z.string().trim().min(2).max(120),
    nameEn: z.string().trim().min(2).max(120),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    descriptionVi: z.string().trim().max(2000),
    descriptionEn: z.string().trim().max(2000),
    price: z.coerce.number().int().min(1000).max(100_000_000),
    compareAtPrice: z.coerce.number().int().min(0).max(100_000_000).nullable(),
    categoryId: z.coerce.number().int().positive(),
    kind: z.enum(GARMENT_KINDS),
    colors: z.array(z.object({ nameVi: z.string().trim().min(1).max(40), nameEn: z.string().trim().min(1).max(40), hex })).min(1).max(12),
    sizes: z.array(z.string().trim().min(1).max(10)).min(1).max(10),
    /** stock for every colour × size combination */
    variants: z.array(z.object({ colorHex: hex, size: z.string().trim().min(1).max(10), stock: z.coerce.number().int().min(0).max(100_000) })).max(120),
    featured: z.boolean(),
    isNew: z.boolean(),
    imageUrl: z.string().trim().url().max(500).nullable().or(z.literal("").transform(() => null)),
  })
  .refine(
    (p) => p.variants.every((v) => p.colors.some((c) => c.hex.toLowerCase() === v.colorHex.toLowerCase()) && p.sizes.includes(v.size)),
    { path: ["variants"] },
  );

export type ProductInput = z.input<typeof productSchema>;

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{3,20}$/),
    type: z.enum(COUPON_TYPES),
    value: z.coerce.number().int().min(0).max(100_000_000),
    maxDiscount: z.coerce.number().int().min(0).max(100_000_000).nullable(),
    minSubtotal: z.coerce.number().int().min(0).max(100_000_000),
    usageLimit: z.coerce.number().int().min(1).max(1_000_000).nullable(),
    startsAt: z.coerce.date().nullable(),
    endsAt: z.coerce.date().nullable(),
    active: z.boolean(),
    descriptionVi: z.string().trim().max(200),
    descriptionEn: z.string().trim().max(200),
  })
  .refine((c) => c.type !== "percent" || (c.value >= 1 && c.value <= 100), { path: ["value"] })
  .refine((c) => c.type !== "fixed" || c.value >= 1000, { path: ["value"] })
  .refine((c) => !c.startsAt || !c.endsAt || c.startsAt < c.endsAt, { path: ["endsAt"] });

export type CouponInput = z.input<typeof couponSchema>;

export const reviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(80),
  body: z.string().trim().min(10, "body").max(1500),
  fit: z.enum(REVIEW_FITS).nullable(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const addressSchema = z.object({
  label: z.string().trim().max(30),
  fullName: z.string().trim().min(2, "name").max(80, "name"),
  phone,
  address: z.string().trim().min(5, "address").max(200, "address"),
  city: z.string().trim().min(2, "city").max(60, "city"),
  isDefault: z.boolean(),
});

export type AddressInput = z.infer<typeof addressSchema>;

/** Guest order lookup: the order code plus the email or phone used at checkout. */
export const trackSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^MAY-?[A-Z0-9]{4,10}$/),
  contact: z.string().trim().min(5).max(120),
});
