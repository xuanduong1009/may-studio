import { isLight, luminance, shade } from "@/lib/color";

/**
 * Procedurally drawn product artwork.
 *
 * Every product in the demo store is rendered from vector shapes so the site
 * works with zero external images and re-colours instantly when a shopper
 * picks a different colour swatch. Real photos can replace this at any time by
 * setting `imageUrl` on a product from the admin panel.
 */

export const GARMENT_KINDS = [
  "tee",
  "hoodie",
  "shirt",
  "jacket",
  "pants",
  "dress",
  "skirt",
  "cap",
  "tote",
] as const;

export type GarmentKind = (typeof GARMENT_KINDS)[number];
export type GarmentView = "front" | "back" | "detail";

type Part = {
  d: string;
  /** -1..1, how much to darken (<0) or lighten (>0) the base colour */
  tone?: number;
  /** draw as a line instead of a filled shape */
  stroke?: boolean;
  dash?: boolean;
  width?: number;
  /** apply the soft light/shadow overlay on top of the fill */
  lit?: boolean;
  /** fixed colour, ignores tone */
  color?: string;
};

type Garment = {
  base: Part[];
  front: Part[];
  back: Part[];
  /** viewBox used for the close-up "detail" view (keeps the 5:6 ratio) */
  detailBox: string;
  logo?: { x: number; y: number; size: number };
  backPrint?: { x: number; y: number; size: number };
};

const ZIP = "#c8c8c8";

const GARMENTS: Record<GarmentKind, Garment> = {
  tee: {
    base: [
      {
        d: "M150 62 C170 80 230 80 250 62 L320 88 C340 98 352 112 362 132 L380 176 L326 200 L304 160 L304 410 C240 422 160 422 96 410 L96 160 L74 200 L20 176 L38 132 C48 112 60 98 80 88 Z",
        lit: true,
      },
      { d: "M32 166 L80 188", stroke: true, dash: true },
      { d: "M368 166 L320 188", stroke: true, dash: true },
      { d: "M100 396 C160 408 240 408 300 396", stroke: true, dash: true },
    ],
    front: [{ d: "M150 62 C165 98 235 98 250 62", stroke: true, width: 9, tone: -0.18 }],
    back: [{ d: "M150 62 C170 74 230 74 250 62", stroke: true, width: 8, tone: -0.18 }],
    detailBox: "110 70 180 216",
    logo: { x: 200, y: 168, size: 18 },
    backPrint: { x: 200, y: 200, size: 44 },
  },
  hoodie: {
    base: [
      {
        d: "M140 92 L260 92 L330 116 C346 124 354 140 358 160 L376 330 L330 340 L304 200 L304 400 L96 400 L96 200 L70 340 L24 330 L42 160 C46 140 54 124 70 116 Z",
        lit: true,
      },
      { d: "M96 400 L304 400 L304 424 C240 432 160 432 96 424 Z", tone: -0.14 },
      { d: "M24 330 L70 340 L66 364 L20 354 Z", tone: -0.14 },
      { d: "M376 330 L330 340 L334 364 L380 354 Z", tone: -0.14 },
    ],
    front: [
      {
        d: "M140 92 C128 40 160 18 200 18 C240 18 272 40 260 92 C244 128 224 140 200 140 C176 140 156 128 140 92 Z",
        lit: true,
      },
      {
        d: "M160 92 C158 58 178 42 200 42 C222 42 242 58 240 92 C228 116 216 124 200 124 C184 124 172 116 160 92 Z",
        tone: -0.28,
      },
      { d: "M130 300 L270 300 L290 382 L110 382 Z", tone: -0.06 },
      { d: "M136 308 L264 308 L282 376 L118 376 Z", stroke: true, dash: true },
      { d: "M186 128 L182 212", stroke: true, width: 4, color: "#f4f1ea" },
      { d: "M214 128 L218 212", stroke: true, width: 4, color: "#f4f1ea" },
    ],
    back: [
      {
        d: "M140 92 C128 40 160 18 200 18 C240 18 272 40 260 92 C240 112 160 112 140 92 Z",
        lit: true,
      },
      { d: "M200 20 L200 106", stroke: true, dash: true },
    ],
    detailBox: "100 40 200 240",
    logo: { x: 200, y: 250, size: 20 },
    backPrint: { x: 200, y: 240, size: 46 },
  },
  shirt: {
    base: [
      {
        d: "M150 60 L250 60 L322 86 C340 94 350 110 354 130 L376 340 L332 348 L304 170 L304 410 C240 426 160 426 96 410 L96 170 L68 348 L24 340 L46 130 C50 110 60 94 78 86 Z",
        lit: true,
      },
      { d: "M24 340 L68 348 L65 372 L21 364 Z", tone: -0.1 },
      { d: "M376 340 L332 348 L335 372 L379 364 Z", tone: -0.1 },
    ],
    front: [
      { d: "M150 60 L200 104 L172 122 L138 72 Z", tone: 0.1, lit: true },
      { d: "M250 60 L200 104 L228 122 L262 72 Z", tone: 0.1, lit: true },
      { d: "M200 104 L200 414", stroke: true, width: 2, tone: -0.2 },
      { d: "M226 150 L270 150 L270 196 L248 204 L226 196 Z", stroke: true, dash: true },
    ],
    back: [
      { d: "M96 122 C160 134 240 134 304 122", stroke: true, dash: true },
      { d: "M150 60 C170 72 230 72 250 60", stroke: true, width: 8, tone: 0.08 },
    ],
    detailBox: "110 50 180 216",
  },
  jacket: {
    base: [
      {
        d: "M148 66 L252 66 L326 92 C344 100 354 116 358 136 L378 336 L334 344 L306 176 L306 384 L94 384 L94 176 L66 344 L22 336 L42 136 C46 116 56 100 74 92 Z",
        lit: true,
      },
      { d: "M94 384 L306 384 L306 414 L94 414 Z", tone: -0.2 },
      { d: "M22 336 L66 344 L62 370 L18 362 Z", tone: -0.2 },
      { d: "M378 336 L334 344 L338 370 L382 362 Z", tone: -0.2 },
      { d: "M148 66 C170 52 230 52 252 66 L238 86 C220 76 180 76 162 86 Z", tone: -0.2 },
    ],
    front: [
      { d: "M200 70 L200 412", stroke: true, width: 4, color: ZIP },
      { d: "M194 92 L206 92 L206 118 L194 118 Z", color: ZIP },
      { d: "M118 286 L158 252", stroke: true, width: 5, tone: -0.3 },
      { d: "M282 286 L242 252", stroke: true, width: 5, tone: -0.3 },
      { d: "M110 150 L150 150", stroke: true, dash: true },
      { d: "M290 150 L250 150", stroke: true, dash: true },
    ],
    back: [{ d: "M94 140 C160 152 240 152 306 140", stroke: true, dash: true }],
    detailBox: "110 50 180 216",
    logo: { x: 130, y: 196, size: 13 },
    backPrint: { x: 200, y: 240, size: 40 },
  },
  pants: {
    base: [
      { d: "M126 40 L274 40 L296 440 L220 440 L200 162 L180 440 L104 440 Z", lit: true },
      { d: "M126 40 L274 40 L276 66 L124 66 Z", tone: -0.16 },
      { d: "M150 126 L138 428", stroke: true, dash: true, tone: 0.12 },
      { d: "M250 126 L262 428", stroke: true, dash: true, tone: 0.12 },
      { d: "M108 424 L178 424", stroke: true, dash: true },
      { d: "M222 424 L292 424", stroke: true, dash: true },
    ],
    front: [
      { d: "M212 66 L212 140 C212 150 206 156 200 156", stroke: true, dash: true },
      { d: "M130 72 C150 78 160 96 162 112", stroke: true, width: 2.5, tone: -0.25 },
      { d: "M270 72 C250 78 240 96 238 112", stroke: true, width: 2.5, tone: -0.25 },
      { d: "M192 46 L208 46 L208 60 L192 60 Z", color: ZIP },
    ],
    back: [
      { d: "M138 100 L182 100 L180 150 L160 158 L140 150 Z", stroke: true, dash: true },
      { d: "M262 100 L218 100 L220 150 L240 158 L260 150 Z", stroke: true, dash: true },
      { d: "M200 66 L200 160", stroke: true, width: 2, tone: -0.2 },
    ],
    detailBox: "110 20 180 216",
  },
  dress: {
    base: [
      {
        d: "M168 40 L182 40 C186 72 214 72 218 40 L232 40 C236 80 246 120 252 160 L336 430 C260 452 140 452 64 430 L148 160 C154 120 164 80 168 40 Z",
        lit: true,
      },
      { d: "M150 164 C180 178 220 178 250 164", stroke: true, width: 7, tone: -0.2 },
      { d: "M172 180 L128 440", stroke: true, tone: -0.12, width: 1.5 },
      { d: "M200 182 L200 446", stroke: true, tone: -0.12, width: 1.5 },
      { d: "M228 180 L272 440", stroke: true, tone: -0.12, width: 1.5 },
    ],
    front: [
      { d: "M182 40 C186 72 214 72 218 40", stroke: true, width: 5, tone: -0.2 },
      { d: "M200 172 L180 160 L180 186 Z M200 172 L220 160 L220 186 Z", tone: -0.25 },
    ],
    back: [{ d: "M200 60 L200 160", stroke: true, width: 3, color: ZIP }],
    detailBox: "110 30 180 216",
  },
  skirt: {
    base: [
      { d: "M138 90 L262 90 L326 400 C250 420 150 420 74 400 Z", lit: true },
      { d: "M138 90 L262 90 L266 116 L134 116 Z", tone: -0.16 },
      { d: "M162 116 L120 406", stroke: true, tone: -0.14, width: 1.5 },
      { d: "M186 116 L172 412", stroke: true, tone: -0.14, width: 1.5 },
      { d: "M214 116 L228 412", stroke: true, tone: -0.14, width: 1.5 },
      { d: "M238 116 L280 406", stroke: true, tone: -0.14, width: 1.5 },
      { d: "M80 390 C150 408 250 408 320 390", stroke: true, dash: true },
    ],
    front: [{ d: "M246 96 L256 96 L256 110 L246 110 Z", color: ZIP }],
    back: [{ d: "M200 116 L200 220", stroke: true, width: 3, color: ZIP }],
    detailBox: "110 70 180 216",
  },
  cap: {
    base: [
      { d: "M110 252 C110 150 160 110 200 110 C240 110 290 150 290 252 Z", lit: true },
      { d: "M200 112 L200 250", stroke: true, dash: true },
      { d: "M200 112 C172 140 152 190 148 250", stroke: true, dash: true },
      { d: "M200 112 C228 140 248 190 252 250", stroke: true, dash: true },
      { d: "M193 112 A7 7 0 1 0 207 112 A7 7 0 1 0 193 112 Z", tone: -0.2 },
    ],
    front: [
      {
        d: "M96 252 C140 236 260 236 304 252 C320 264 318 284 300 294 C260 310 140 310 100 294 C82 284 80 264 96 252 Z",
        tone: -0.08,
        lit: true,
      },
      { d: "M104 262 C150 250 250 250 296 262", stroke: true, dash: true },
    ],
    back: [
      { d: "M176 222 L224 222 C228 222 230 226 230 230 L230 252 L170 252 L170 230 C170 226 172 222 176 222 Z", tone: -0.3 },
      { d: "M186 236 L214 236", stroke: true, width: 4, color: ZIP },
    ],
    detailBox: "110 110 180 216",
    logo: { x: 200, y: 205, size: 18 },
  },
  tote: {
    base: [
      { d: "M100 170 L300 170 L318 432 L82 432 Z", lit: true },
      { d: "M102 192 L298 192", stroke: true, dash: true },
      { d: "M86 414 L314 414", stroke: true, dash: true },
    ],
    front: [
      { d: "M150 172 C150 64 250 64 250 172", stroke: true, width: 14, tone: -0.12 },
    ],
    back: [
      { d: "M140 172 C140 76 260 76 260 172", stroke: true, width: 14, tone: -0.2 },
    ],
    detailBox: "110 150 180 216",
    logo: { x: 200, y: 312, size: 40 },
    backPrint: { x: 200, y: 312, size: 26 },
  },
};

export function GarmentArt({
  kind,
  color,
  view = "front",
  className,
  title,
  bare = false,
}: {
  kind: GarmentKind | string;
  color: string;
  view?: GarmentView;
  className?: string;
  title?: string;
  /** no backdrop: just the garment and its shadow (for flat-lay compositions) */
  bare?: boolean;
}) {
  const g = GARMENTS[(kind as GarmentKind) in GARMENTS ? (kind as GarmentKind) : "tee"];
  const light = isLight(color);
  const veryDark = luminance(color) < 0.04;
  const id = `ga-${kind}-${color.replace("#", "")}-${view}`;

  const tone = (t: number) => (veryDark && t < 0 ? shade(color, Math.abs(t) * 0.9) : shade(color, t));
  const stitch = veryDark || luminance(color) < 0.18 ? shade(color, 0.4) : shade(color, -0.32);
  const bgA = light ? "#efece6" : shade(color, 0.86);
  const bgB = light ? "#ddd8cf" : shade(color, 0.68);
  const ink = light || luminance(color) > 0.35 ? shade(color, -0.65) : shade(color, 0.85);

  const parts = [...g.base, ...(view === "back" ? g.back : g.front)];
  const viewBox = view === "detail" ? g.detailBox : "0 0 400 480";

  return (
    <svg
      viewBox={viewBox}
      className={className}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor={bgA} />
          <stop offset="100%" stopColor={bgB} />
        </radialGradient>
        <linearGradient id={`${id}-lit`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <pattern id={`${id}-tex`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={light ? "#000" : "#fff"} strokeOpacity="0.07" strokeWidth="2" />
        </pattern>
      </defs>

      {bare ? null : <rect x="-200" y="-200" width="800" height="880" fill={`url(#${id}-bg)`} />}
      {bare ? null : <ellipse cx="200" cy="452" rx="150" ry="13" fill="#000" opacity="0.1" />}

      {parts.map((p, i) => {
        if (p.stroke) {
          return (
            <path
              key={i}
              d={p.d}
              fill="none"
              stroke={p.color ?? (p.tone !== undefined ? tone(p.tone) : stitch)}
              strokeWidth={p.width ?? 2}
              strokeDasharray={p.dash ? "5 5" : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        }
        const fill = p.color ?? tone(p.tone ?? 0);
        return (
          <g key={i}>
            <path d={p.d} fill={fill} />
            {p.lit ? <path d={p.d} fill={`url(#${id}-lit)`} /> : null}
          </g>
        );
      })}

      {view !== "back" && g.logo ? (
        <text
          x={g.logo.x}
          y={g.logo.y}
          fontSize={g.logo.size}
          textAnchor="middle"
          fill={ink}
          fontWeight={700}
          letterSpacing="0.2em"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          MÂY
        </text>
      ) : null}

      {view === "back" && g.backPrint ? (
        <g fill={ink} textAnchor="middle" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
          <text x={g.backPrint.x} y={g.backPrint.y} fontSize={g.backPrint.size} fontStyle="italic" fontWeight={600}>
            Mây
          </text>
          <text
            x={g.backPrint.x}
            y={g.backPrint.y + g.backPrint.size * 0.55}
            fontSize={g.backPrint.size * 0.24}
            letterSpacing="0.4em"
          >
            STUDIO · SÀI GÒN
          </text>
        </g>
      ) : null}

      {view === "detail" ? <rect x="0" y="0" width="400" height="480" fill={`url(#${id}-tex)`} /> : null}
    </svg>
  );
}
