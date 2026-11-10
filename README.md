# MÂY Studio: bilingual fashion e-commerce

A full-stack clothing store built with **Next.js 16**, **TypeScript** and **SQLite/Turso**. It covers the whole order lifecycle: stock per colour and size, coupons, VietQR / VNPay payments with automatic confirmation, transactional email, order tracking, verified reviews and an admin back office.

> 🇻🇳 Cửa hàng thời trang song ngữ Việt/Anh: tồn kho theo màu × size, mã giảm giá, thanh toán VietQR/VNPay tự xác nhận, email, theo dõi đơn, đánh giá từ người mua thật và trang quản trị đầy đủ.

**Live demo:** _add your Vercel URL here_ · **Read-only admin:** `viewer@may.studio` / `viewer12345`

![Home](docs/screenshots/home.png)

| Best sellers (real product photos) | Campaign (stacked full-screen panels) | Gallery wall |
| --- | --- | --- |
| ![Featured](docs/screenshots/featured.png) | ![Campaign](docs/screenshots/campaign.png) | ![Gallery](docs/screenshots/gallery.png) |

| First-visit intro | Shop the look (scroll-zoom + hotspots) | Hover-reveal categories |
| --- | --- | --- |
| ![Intro](docs/screenshots/intro.png) | ![Shop the look](docs/screenshots/shop-the-look.png) | ![Categories](docs/screenshots/categories.png) |

| Image-led mega menu | Quick view | Size finder |
| --- | --- | --- |
| ![Mega menu](docs/screenshots/mega-menu.png) | ![Quick view](docs/screenshots/quick-view.png) | ![Size finder](docs/screenshots/size-finder.png) |

| Instant search (Ctrl+K) | Product | Verified reviews |
| --- | --- | --- |
| ![Search](docs/screenshots/search.png) | ![Product](docs/screenshots/product.png) | ![Reviews](docs/screenshots/reviews.png) |

| Lookbook (pinned horizontal scroll) | Our story | How it's made |
| --- | --- | --- |
| ![Lookbook](docs/screenshots/lookbook.png) | ![About](docs/screenshots/about.png) | ![Process](docs/screenshots/about-process.png) |

| Shop (category chips, grid density) | Fullscreen photo viewer | Complete the look |
| --- | --- | --- |
| ![Shop](docs/screenshots/shop.png) | ![Lightbox](docs/screenshots/lightbox.png) | ![Complete the look](docs/screenshots/complete-look.png) |

| Reviews wall | Help centre |
| --- | --- |
| ![Reviews wall](docs/screenshots/reviews-wall.png) | ![Help](docs/screenshots/help.png) |

| Checkout | VietQR payment | Order tracking |
| --- | --- | --- |
| ![Checkout](docs/screenshots/checkout.png) | ![VietQR](docs/screenshots/vietqr.png) | ![Track](docs/screenshots/track.png) |

| Admin dashboard | Order detail & audit log | Coupons |
| --- | --- | --- |
| ![Admin](docs/screenshots/admin.png) | ![Order](docs/screenshots/admin-order.png) | ![Coupons](docs/screenshots/admin-coupons.png) |

| Stock matrix | Printable invoice | Dark mode · Mobile |
| --- | --- | --- |
| ![Stock](docs/screenshots/admin-stock.png) | ![Invoice](docs/screenshots/invoice.png) | ![Dark](docs/screenshots/dark-en.png) ![Mobile](docs/screenshots/mobile.png) |

## Features

**Design & motion** (editorial patterns from award-winning fashion sites, built from scratch)
- **WebGL cloud shader** ("mây" means cloud): domain-warped noise clouds in the brand palette that part around the cursor. No libraries, half-resolution rendering, pauses off-screen, single still frame with "reduce motion"
- **First-visit intro** (counter + wordmark + curtain), shown once per session, then the hero's per-letter entrance
- **Page transitions**: a brand-colour curtain between pages (skipped for filter changes on the same page)
- **Custom cursor** that trails the native one and turns into a labelled disc ("View", "Zoom") over products; magnetic call-to-action buttons
- **Scroll storytelling**: a manifesto whose words light up as you scroll, a hero that shrinks into a rounded frame, and a **shop-the-look flat-lay** that zooms to full screen and then reveals hotspots on every piece
- **About 95 real photos** (free Pexels licence, see [docs/CREDITS.md](docs/CREDITS.md)) served through `next/image` (AVIF/WebP, responsive sizes): every product has a gallery with **one or more photos per colour** (switching colour switches the photo), plus an arched hero portrait with a shoppable tag, a cinematic lookbook, a stacked full-screen **campaign**, a masonry **gallery wall** and atelier photos on the story page. Order lines keep a snapshot of the photo, so orders, invoices and the admin show what was bought. Product photos are toned onto one warm studio backdrop (multiply blend) and cropped 3:4, so a grid of photos from different shoots reads as one catalogue. Procedural SVG illustrations remain as a fallback for products created without photos
- **Hover-reveal category list** with a photo preview that follows the cursor and leans with its speed
- **Instant navigation feedback**: a loading skeleton and progress bar are prefetched, so every click responds immediately
- **Image-led mega menu**, **reviews wall** fed by real reviews, app-style **mobile tab bar**

**Shopping**
- Animated product cards with 3D tilt, front/back flip, colour switching, quick add and a "fly to cart" animation
- **Quick view** modal from any card or hotspot (variant-aware, add to cart without leaving the page)
- **Shop toolbar**: photo category chips, removable active-filter chips and a 2/3/4-column grid switch that is remembered
- **Product gallery**: arrows, swipe on touch, hover zoom and a **fullscreen viewer** (keyboard ← → Esc, swipe, thumbnails)
- **Delivery & trust block**: estimated delivery dates, free-shipping threshold, 30-day returns and payment methods next to the buy button
- **Complete the look**: best sellers from other categories on every product page
- **Size finder**: height, weight and fit preference become a size suggestion that is remembered and highlighted on every product
- **Our story** and **help centre** pages: searchable FAQ, policies, size guide and a contact form (with a honeypot)
- **Instant search palette** (Ctrl+K or `/`): live results as you type, keyboard navigation, recent searches. Accent-insensitive, so "ao thun" finds "Áo thun"
- **Stock per colour × size**: sold-out sizes are crossed out per colour, the quantity picker respects the variant's stock, and low-stock urgency is shown per variant
- **Verified reviews**: only customers whose order was delivered can review. Includes a star histogram, a fit meter (runs small / true / large), filters and sorting
- Recently viewed products, wishlist, size guide, slide-out cart with a free-shipping progress bar

**Checkout & payments**
- Coupons stored in the database: percentage (with a cap), fixed amount or free shipping, with a minimum order, usage limit and start/end dates. Checked live, then re-checked on the server
- **VietQR bank transfer**: a scannable NAPAS/EMVCo QR code with the amount and order reference pre-filled. A bank webhook (SePay) marks the order paid, and the success page flips to "Payment received" automatically
- **VNPay** gateway (sandbox ready): signed redirect, return URL and IPN handling
- Cash on delivery, which is marked paid automatically when the order is delivered
- Express delivery only offered where it exists (Ho Chi Minh City and Hanoi). The 34 provinces after the 2025 merger
- Saved address book that pre-fills checkout

**After the sale**
- Order tracking for guests (order code + email or phone) with a progress timeline and full history
- Customers can cancel pending orders; stock and coupon usage are returned
- Transactional emails (confirmation, payment received, status updates, password reset) in the customer's language
- Accounts: order history, address book, profile, password change, forgot/reset password

**Admin** (`/admin`)
- Dashboard: revenue chart, KPIs, best sellers, unpaid-order alert, **low-stock list with inline restock**
- Orders: search, filters (status, awaiting payment), detail page with audit log, internal notes, manual payment confirmation, **printable invoice**, **CSV export**
- Products: CRUD with a live preview and a **colour × size stock matrix**
- Coupons, customers (lifetime spend, role management) and review moderation
- A read-only `viewer` role so the public can explore the back office without changing data

## Engineering highlights

- **Server-authoritative orders:** the browser only sends product IDs, colours, sizes and quantities. Prices, coupons and shipping are recalculated on the server (`src/app/actions/orders.ts`).
- **No overselling, no over-redeeming:** inside one transaction, each variant's stock is decremented with `WHERE stock >= qty` and a coupon use is claimed with `WHERE used_count < usage_limit`, so concurrent shoppers cannot buy the last item or the last coupon use twice.
- **Order state machine:** allowed transitions live in one table (`STATUS_FLOW`). Updates are conditional on the previous status, so two admins clicking at once cannot apply a change twice. Cancelling restocks the items and releases the coupon.
- **Idempotent payments:** bank webhooks and VNPay IPN may arrive more than once. `markOrderPaid` only acts on unpaid orders, checks the amount and logs every attempt (`src/lib/orders.ts`).
- **Payment security:** VNPay callbacks are verified with HMAC-SHA512 and a timing-safe comparison. The bank webhook requires an API key. The VietQR payload, including its CRC-16, is built from the EMVCo spec and unit-tested.
- **Audit trail:** every order keeps an event log (created, status changes, payments, internal notes, with who and when). Customers and admins see the same history.
- **Emails never block checkout:** they are sent with Next.js `after()` once the response has gone out. Without a Resend key they are printed to the server log, so everything works locally.
- **Role-based access & abuse protection:** `user` / `admin` / read-only `viewer`, checked in every server action. Rate limits on sign-in, sign-up and password reset. Demo accounts cannot change their password. Order lookups never reveal whether a code exists. CSV export guards against formula injection.
- **Security headers:** `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- **Type-safe i18n:** about 500 translation keys checked at compile time in both languages.
- **Tests & CI:** unit tests for pricing, coupon rules, the VietQR payload, VNPay signing, validators, stock helpers, order access and size recommendation (Node's built-in test runner). GitHub Actions runs type check, tests, a seeded database and a production build on every push.

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions, Route Handlers, `after()`), React 19, TypeScript |
| Styling & motion | Tailwind CSS 4, Motion, Lenis smooth scroll |
| Data | Drizzle ORM, libSQL (local SQLite file, Turso in production) |
| Auth | Better Auth (email + password, database sessions, password reset, rate limiting) |
| Payments | VietQR (EMVCo) + SePay webhook, VNPay |
| Email | Resend HTTP API |
| i18n | next-intl (`/` Vietnamese, `/en` English) |
| Forms & validation | React Hook Form, Zod |
| State | Zustand (cart, wishlist and recently viewed, persisted in `localStorage`) |
| Quality | Node test runner + tsx, GitHub Actions |

## Getting started

Requirements: **Node.js 20.19+** (22 LTS recommended).

```bash
npm install
cp .env.example .env.local        # then set BETTER_AUTH_SECRET to a long random string
npm run setup                     # creates the tables and seeds demo data
npm run dev                       # http://localhost:3000
npm test                          # unit tests
```

Everything works without any third-party account. Payments run in demo mode: the VietQR block has a "Simulate transfer" button that triggers the same code path as the bank webhook. Emails are printed to the terminal.

### Demo accounts (created by the seed)

| Role | Email | Password |
| --- | --- | --- |
| Customer (has delivered orders to review) | `demo@may.studio` | `demo12345` |
| Read-only admin | `viewer@may.studio` | `viewer12345` |
| Admin | value of `ADMIN_EMAILS` | value of `SEED_ADMIN_PASSWORD` |

Demo coupons: `MAY10`, `WELCOME50K` (from 400K), `FREESHIP`. `BLACKFRIDAY` is scheduled, `SUMMER25` has expired and `VIP100K` is switched off, so each error state can be tried.

### Optional integrations

| Feature | Environment variables | Notes |
| --- | --- | --- |
| Real VietQR | `BANK_BIN`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME`, `BANK_NAME` | BIN examples: Vietcombank 970436, MB 970422, Techcombank 970407 |
| Automatic bank confirmation | `SEPAY_WEBHOOK_KEY` | Point a [SePay](https://sepay.vn) webhook at `/api/payments/bank-webhook` |
| VNPay | `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL` | Free sandbox: [sandbox.vnpayment.vn/devreg](https://sandbox.vnpayment.vn/devreg/). IPN URL: `/api/payments/vnpay/ipn` |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` | [resend.com](https://resend.com), free tier |

## Deploying (Vercel + Turso, both free tiers)

1. **Create the database:** sign up at [turso.tech](https://turso.tech), create a database, then copy its URL (`libsql://…`) and an auth token.
2. **Fill the production database from your machine:** put the Turso values in `.env.local` (`DATABASE_URL`, `DATABASE_AUTH_TOKEN`), set a strong `SEED_ADMIN_PASSWORD`, then run `npm run setup`. Switch `.env.local` back to `file:local.db` afterwards.
3. **Push the code to GitHub.** CI runs automatically.
4. **Import the repo on [vercel.com](https://vercel.com)** and add `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `BETTER_AUTH_SECRET` and `ADMIN_EMAILS`, plus any optional integrations above.
5. Deploy. The site and sign-in use the Vercel production domain automatically; set `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` only when you add a custom domain.

## Project structure

```
src/
  app/
    [locale]/          pages: home, shop, product, checkout (+ success), track, account/*, login,
                       register, forgot/reset password, wishlist, admin/* (dashboard, products,
                       orders, coupons, customers, reviews)
    actions/           server actions: orders, account, admin
    api/               auth, search, payments (VNPay IPN/return, bank webhook),
                       order payment status, admin CSV export
  components/          home/, product/, shop/, search/, cart/, checkout/, account/, admin/, layout/, ui/
  lib/
    db/                schema (products, variants, orders, events, coupons, reviews, addresses…) + client
    payments/          vietqr.ts (EMVCo payload + CRC), vnpay.ts (signing + verification)
    orders.ts          order state machine, payments, restocking, coupon checks
    pricing.ts         pure pricing & coupon rules (shared by client and server)
    email.ts           Resend client + bilingual templates
    auth.ts, session.ts, queries.ts, validators.ts, inventory.ts, site.ts
  i18n/                routing, navigation, request config
  store/               cart, wishlist, recently viewed (Zustand)
  proxy.ts             locale routing (Next.js 16 "proxy", formerly middleware)
messages/              vi.json, en.json
scripts/seed.ts        demo data (variants, coupons, orders with history, reviews)
tests/                 unit tests
.github/workflows/     CI
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests |
| `npm run db:push` | Create or update tables from the schema |
| `npm run db:seed` | Reset store data and create the demo accounts |

---

MÂY Studio is a fictional brand made for learning and portfolio purposes. No real transactions take place unless you configure your own payment accounts.
