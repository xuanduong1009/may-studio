/**
 * The sample catalogue created by scripts/seed.ts: categories, and products
 * with their colours (keys of PALETTE in src/lib/site.ts) and the photos of
 * each colour (Pexels ids, files in public/images/pexels).
 */
type ColorKey = (typeof import("../src/lib/site").PALETTE)[number]["key"];

export type SampleProduct = {
  slug: string;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  price: number;
  compareAtPrice?: number;
  kind: string;
  /** category slug */
  category: string;
  sizes: string[];
  /** each colour with its photos, first photo first */
  looks: [ColorKey, number[]][];
  /** total stock, spread over the colour × size variants by the seed */
  stock: number;
  sold: number;
  featured?: boolean;
  isNew?: boolean;
};

export const CATEGORIES = [
  { slug: "ao-thun", nameVi: "Áo thun", nameEn: "T-shirts", kind: "tee", color: "#ece0c8", sortOrder: 1 },
  { slug: "so-mi", nameVi: "Sơ mi", nameEn: "Shirts", kind: "shirt", color: "#9cc3e0", sortOrder: 2 },
  { slug: "hoodie", nameVi: "Hoodie & Nỉ", nameEn: "Hoodies", kind: "hoodie", color: "#a3b19b", sortOrder: 3 },
  { slug: "ao-khoac", nameVi: "Áo khoác", nameEn: "Jackets", kind: "jacket", color: "#6b6b3a", sortOrder: 4 },
  { slug: "quan", nameVi: "Quần", nameEn: "Trousers", kind: "pants", color: "#cdb48e", sortOrder: 5 },
  { slug: "vay-dam", nameVi: "Váy đầm", nameEn: "Dresses", kind: "dress", color: "#d8a7a1", sortOrder: 6 },
  { slug: "chan-vay", nameVi: "Chân váy", nameEn: "Skirts", kind: "skirt", color: "#b65a3c", sortOrder: 7 },
  { slug: "phu-kien", nameVi: "Phụ kiện", nameEn: "Accessories", kind: "tote", color: "#f5f3ee", sortOrder: 8 },
];

const TOPS = ["S", "M", "L", "XL"];
const ALL = ["XS", "S", "M", "L", "XL"];
const WOMEN = ["XS", "S", "M", "L"];
const FREE = ["FREE"];

export const PRODUCTS: SampleProduct[] = [
  // ---------------- T-shirts ----------------
  {
    slug: "ao-thun-cotton-huu-co",
    nameVi: "Áo thun cotton hữu cơ",
    nameEn: "Organic cotton tee",
    descriptionVi: "Áo thun dáng suông, cotton hữu cơ 220gsm dày dặn nhưng thoáng mát. Cổ bo mềm, không bai sau nhiều lần giặt.",
    descriptionEn: "A relaxed tee in 220gsm organic cotton, substantial yet breathable. A soft ribbed collar that keeps its shape wash after wash.",
    price: 290_000, kind: "tee", category: "ao-thun", sizes: TOPS,
    looks: [["white", [17858295, 11671964]], ["black", [8532616]]],
    stock: 120, sold: 342, featured: true,
  },
  {
    slug: "ao-thun-oversize-may",
    nameVi: "Áo thun oversize",
    nameEn: "Oversized tee",
    descriptionVi: "Form rộng rủ vai, vải cotton compact mềm mịn. Phối cùng quần ống rộng cho vẻ ngoài thoải mái mà vẫn gọn gàng.",
    descriptionEn: "A dropped-shoulder oversized fit in soft compact cotton. Pair it with wide trousers for an easy, tidy look.",
    price: 350_000, kind: "tee", category: "ao-thun", sizes: TOPS,
    looks: [["sand", [11545747, 6786618]], ["white", [9775889]], ["rose", [9558761]]],
    stock: 80, sold: 198, isNew: true,
  },
  {
    slug: "ao-thun-co-tron-basic",
    nameVi: "Áo thun cổ tròn basic",
    nameEn: "Everyday crew tee",
    descriptionVi: "Chiếc áo thun trắng cơ bản mặc hằng ngày, phối được với mọi thứ từ jean đến kaki.",
    descriptionEn: "The everyday white tee that goes with everything, from jeans to chinos.",
    price: 190_000, compareAtPrice: 250_000, kind: "tee", category: "ao-thun", sizes: ALL,
    looks: [["white", [17745134, 8217536, 9558927]], ["brown", [6311599]]],
    stock: 200, sold: 512,
  },
  // ---------------- Shirts ----------------
  {
    slug: "so-mi-linen-tay-dai",
    nameVi: "Sơ mi linen tay dài",
    nameEn: "Long-sleeve linen shirt",
    descriptionVi: "Sơ mi 100% linen dáng rộng, càng giặt càng mềm. Mặc cài hết cúc hay khoác ngoài đều đẹp, hợp khí hậu Sài Gòn.",
    descriptionEn: "A relaxed 100% linen shirt that softens with every wash. Wear it buttoned or open, made for Saigon's climate.",
    price: 590_000, compareAtPrice: 750_000, kind: "shirt", category: "so-mi", sizes: TOPS,
    looks: [["white", [20356179, 7752454]]],
    stock: 45, sold: 167, featured: true,
  },
  {
    slug: "so-mi-oxford",
    nameVi: "Sơ mi Oxford cổ điển",
    nameEn: "Classic Oxford shirt",
    descriptionVi: "Vải Oxford dệt chéo bền chắc, form vừa vặn. Thắt vạt cùng quần jean cho ngày cuối tuần hay sơ vin đi làm.",
    descriptionEn: "Durable basket-weave Oxford cloth in a regular fit. Knot it over jeans at the weekend or tuck it in for work.",
    price: 520_000, kind: "shirt", category: "so-mi", sizes: ALL,
    looks: [["white", [34977354, 11380486]], ["rose", [35414994]], ["navy", [18516993]]],
    stock: 60, sold: 143,
  },
  {
    slug: "so-mi-ngan-tay",
    nameVi: "Sơ mi ngắn tay",
    nameEn: "Short-sleeve shirt",
    descriptionVi: "Sơ mi ngắn tay vải rayon rủ mềm, cổ bẻ thoáng. Mảnh ghép dễ mặc cho mùa hè.",
    descriptionEn: "A short-sleeve shirt in soft, drapey rayon with an easy collar. The summer piece you will reach for most.",
    price: 450_000, kind: "shirt", category: "so-mi", sizes: TOPS,
    looks: [["black", [18166539]], ["sage", [17901281]]],
    stock: 3, sold: 89, isNew: true,
  },
  // ---------------- Hoodies & knitwear ----------------
  {
    slug: "hoodie-ni-bong-day",
    nameVi: "Hoodie nỉ bông dày",
    nameEn: "Heavyweight fleece hoodie",
    descriptionVi: "Nỉ bông 380gsm, mặt trong lông mịn giữ ấm tốt. Mũ hai lớp, túi kangaroo rộng.",
    descriptionEn: "380gsm brushed fleece that keeps you warm, with a double-layer hood and a roomy kangaroo pocket.",
    price: 690_000, kind: "hoodie", category: "hoodie", sizes: TOPS,
    looks: [["cream", [19805883]], ["white", [8217308, 8217415]]],
    stock: 70, sold: 256, featured: true,
  },
  {
    slug: "bo-ni-hoodie",
    nameVi: "Bộ nỉ hoodie & jogger",
    nameEn: "Hoodie & jogger set",
    descriptionVi: "Trọn bộ hoodie và quần jogger cùng màu, nỉ da cá mềm, mặc ở nhà hay ra phố đều hợp.",
    descriptionEn: "A matching hoodie and jogger set in soft loopback fleece, for lounging at home or heading out.",
    price: 890_000, compareAtPrice: 1_050_000, kind: "hoodie", category: "hoodie", sizes: ALL,
    looks: [["rose", [10877553]], ["sage", [9775733]]],
    stock: 55, sold: 121,
  },
  {
    slug: "ao-len-to-soi",
    nameVi: "Áo len dệt kim to sợi",
    nameEn: "Chunky knit sweater",
    descriptionVi: "Len dệt kim sợi to, dáng rộng ôm lấy người. Ấm áp cho những tối se lạnh Đà Lạt hay phòng máy lạnh.",
    descriptionEn: "A roomy chunky knit that wraps around you. Cosy for cool Da Lat evenings or air-conditioned offices.",
    price: 720_000, kind: "hoodie", category: "hoodie", sizes: TOPS,
    looks: [["cream", [6454779, 6630834]], ["taupe", [7760243, 5709914]]],
    stock: 0, sold: 140, isNew: true,
  },
  {
    slug: "ao-len-co-lo-mong",
    nameVi: "Áo len cổ lọ mỏng",
    nameEn: "Fine-knit turtleneck",
    descriptionVi: "Len mỏng mịn, cổ lọ thanh lịch. Mặc riêng hoặc làm lớp lót dưới sơ mi và áo khoác.",
    descriptionEn: "A fine, smooth knit with a clean turtleneck. Wear it alone or layered under shirts and jackets.",
    price: 420_000, kind: "hoodie", category: "hoodie", sizes: TOPS,
    looks: [["cream", [27946746, 7764016]], ["emerald", [9901577]]],
    stock: 42, sold: 67,
  },
  // ---------------- Jackets ----------------
  {
    slug: "ao-trench-chong-nuoc",
    nameVi: "Áo măng tô dáng dài",
    nameEn: "Longline coat",
    descriptionVi: "Măng tô dáng dài, vai rộng, ve áo bản to và lớp phủ chống nước nhẹ. Khoác ngoài là đủ thành một bộ đồ.",
    descriptionEn: "A longline coat with wide shoulders, broad lapels and a light water-repellent finish. Throw it on and the outfit is done.",
    price: 1_290_000, compareAtPrice: 1_590_000, kind: "jacket", category: "ao-khoac", sizes: TOPS,
    looks: [["sand", [8358786]], ["black", [8441405]], ["red", [17160306]]],
    stock: 35, sold: 98, featured: true,
  },
  {
    slug: "blazer-linen",
    nameVi: "Blazer linen dáng rộng",
    nameEn: "Relaxed linen blazer",
    descriptionVi: "Blazer linen không lót, vai mềm, dáng rộng hiện đại. Khoác ngoài áo thun cũng thanh lịch như đi cùng sơ mi.",
    descriptionEn: "An unlined linen blazer with soft shoulders and a modern relaxed cut. As sharp over a tee as with a shirt.",
    price: 1_190_000, kind: "jacket", category: "ao-khoac", sizes: TOPS,
    looks: [["cream", [18173600]], ["black", [6856000]]],
    stock: 28, sold: 54, featured: true, isNew: true,
  },
  {
    slug: "ao-khoac-tui-hop",
    nameVi: "Áo khoác kaki túi hộp",
    nameEn: "Utility cotton jacket",
    descriptionVi: "Kaki cotton đứng dáng, bốn túi hộp tiện dụng. Phối cùng quần cargo hay quần jean đều cá tính.",
    descriptionEn: "Structured cotton twill with four patch pockets. Wear it with cargo trousers or jeans.",
    price: 990_000, kind: "jacket", category: "ao-khoac", sizes: TOPS,
    looks: [["cream", [6211655]], ["sand", [7161413]]],
    stock: 25, sold: 76, isNew: true,
  },
  {
    slug: "ao-khoac-overshirt",
    nameVi: "Áo khoác overshirt",
    nameEn: "Cotton overshirt jacket",
    descriptionVi: "Nửa sơ mi nửa áo khoác, vải cotton dày vừa phải. Lớp áo khoác nhẹ cho mọi mùa.",
    descriptionEn: "Half shirt, half jacket, in mid-weight cotton. The light layer for every season.",
    price: 790_000, kind: "jacket", category: "ao-khoac", sizes: ALL,
    looks: [["cream", [10153584]]],
    stock: 40, sold: 64,
  },
  // ---------------- Trousers ----------------
  {
    slug: "quan-ong-suong-linen",
    nameVi: "Quần ống suông linen",
    nameEn: "Wide-leg linen trousers",
    descriptionVi: "Lưng cao, ống suông rộng thoáng mát, tôn dáng. Mặc cùng blazer cùng màu thành một bộ suit mềm mại.",
    descriptionEn: "High-waisted with a breezy wide leg that flatters every figure. Pair with the matching blazer for a soft suit.",
    price: 550_000, kind: "pants", category: "quan", sizes: ALL,
    looks: [["sand", [18173600]], ["black", [14408067]]],
    stock: 65, sold: 233, featured: true,
  },
  {
    slug: "quan-kaki-dang-dung",
    nameVi: "Quần kaki dáng đứng",
    nameEn: "Straight-fit chinos",
    descriptionVi: "Kaki co giãn nhẹ, xếp ly trước, dáng đứng gọn gàng. Mặc đi làm thoải mái cả ngày.",
    descriptionEn: "Lightly stretchy pleated chinos in a clean straight fit, comfortable all day at work.",
    price: 490_000, compareAtPrice: 590_000, kind: "pants", category: "quan", sizes: ALL,
    looks: [["cream", [19456445]], ["sand", [9558927]], ["brown", [13578627]]],
    stock: 90, sold: 187,
  },
  {
    slug: "quan-jean-ong-rong",
    nameVi: "Quần jean ống rộng",
    nameEn: "Wide-leg jeans",
    descriptionVi: "Denim 12oz wash nhẹ, lưng cao, ống rộng thời thượng.",
    descriptionEn: "12oz denim with a light wash, a high rise and a modern wide leg.",
    price: 650_000, kind: "pants", category: "quan", sizes: ALL,
    looks: [["denim", [27786098, 24779116]], ["white", [9604191]]],
    stock: 50, sold: 154, isNew: true,
  },
  // ---------------- Dresses ----------------
  {
    slug: "dam-satin-hai-day",
    nameVi: "Đầm satin hai dây",
    nameEn: "Satin slip dress",
    descriptionVi: "Satin mềm rủ, ánh nhẹ dưới ánh đèn. Dây mảnh điều chỉnh được, dáng suông theo đường cơ thể.",
    descriptionEn: "Fluid satin with a soft sheen, adjustable thin straps and a bias cut that follows the body.",
    price: 790_000, kind: "dress", category: "vay-dam", sizes: WOMEN,
    looks: [["white", [5254750]], ["sand", [7166022]], ["black", [21904524]]],
    stock: 30, sold: 118, featured: true, isNew: true,
  },
  {
    slug: "dam-linen-maxi",
    nameVi: "Đầm linen maxi",
    nameEn: "Linen maxi dress",
    descriptionVi: "Đầm dài linen, cúc gỗ và nơ thắt sau lưng. Hợp đi biển, đi chợ sáng hay dạo phố.",
    descriptionEn: "A long linen dress with wooden buttons and a tie back. Right for the beach, the morning market or the city.",
    price: 850_000, compareAtPrice: 1_050_000, kind: "dress", category: "vay-dam", sizes: WOMEN,
    looks: [["cream", [8190290, 13816064, 6976789]]],
    stock: 22, sold: 91,
  },
  {
    slug: "dam-cotton-theu",
    nameVi: "Đầm cotton thêu",
    nameEn: "Embroidered cotton dress",
    descriptionVi: "Cotton nhẹ thêu ren thủ công ở tay áo, dáng suông thoải mái.",
    descriptionEn: "Light cotton with hand-finished lace embroidery on the sleeves, in an easy loose shape.",
    price: 620_000, kind: "dress", category: "vay-dam", sizes: WOMEN,
    looks: [["white", [8058235, 4256573]], ["cream", [7956307]]],
    stock: 4, sold: 73,
  },
  // ---------------- Skirts ----------------
  {
    slug: "chan-vay-xep-ly",
    nameVi: "Chân váy xếp ly",
    nameEn: "Pleated skirt",
    descriptionVi: "Xếp ly đều, lưng cao, bay bổng theo từng bước đi.",
    descriptionEn: "Even pleats on a high waist that sway as you walk.",
    price: 480_000, kind: "skirt", category: "chan-vay", sizes: WOMEN,
    looks: [["black", [11531455]]],
    stock: 48, sold: 132, featured: true,
  },
  {
    slug: "chan-vay-ke-caro",
    nameVi: "Chân váy kẻ caro",
    nameEn: "Check wrap skirt",
    descriptionVi: "Vải dạ kẻ caro cổ điển, dáng quấn với hàng cúc kim loại.",
    descriptionEn: "Classic check wool-blend in a wrap shape with metal buttons.",
    price: 520_000, kind: "skirt", category: "chan-vay", sizes: WOMEN,
    looks: [["navy", [4120181]]],
    stock: 33, sold: 58,
  },
  {
    slug: "chan-vay-linen",
    nameVi: "Chân váy linen dáng dài",
    nameEn: "Long linen skirt",
    descriptionVi: "Linen nhẹ, dáng dài qua bắp chân, lưng chun sau tiện lợi.",
    descriptionEn: "Light linen in a below-the-calf length with an easy elasticated back.",
    price: 560_000, kind: "skirt", category: "chan-vay", sizes: WOMEN,
    looks: [["cream", [31649570]]],
    stock: 36, sold: 47, isNew: true,
  },
  // ---------------- Accessories ----------------
  {
    slug: "tui-tote-canvas",
    nameVi: "Túi tote canvas",
    nameEn: "Canvas tote bag",
    descriptionVi: "Canvas 16oz dày dặn, đựng vừa laptop 14 inch.",
    descriptionEn: "Heavy 16oz canvas that fits a 14-inch laptop.",
    price: 250_000, kind: "tote", category: "phu-kien", sizes: FREE,
    looks: [["black", [1214212]], ["cream", [6787035]]],
    stock: 110, sold: 389,
  },
  {
    slug: "tui-tote-slogan",
    nameVi: "Túi canvas dây rút",
    nameEn: "Canvas drawstring bag",
    descriptionVi: "Túi canvas mộc dây rút, nhẹ và gọn, đựng đồ đi tập hay đi chợ cuối tuần.",
    descriptionEn: "A raw canvas drawstring bag, light and compact, for the gym or the weekend market.",
    price: 180_000, compareAtPrice: 230_000, kind: "tote", category: "phu-kien", sizes: FREE,
    looks: [["cream", [9603489]]],
    stock: 75, sold: 102, isNew: true,
  },
  {
    slug: "mu-luoi-trai",
    nameVi: "Mũ lưỡi trai cotton",
    nameEn: "Cotton cap",
    descriptionVi: "Cotton twill mềm, khóa sau điều chỉnh được.",
    descriptionEn: "Soft cotton twill with an adjustable back strap.",
    price: 220_000, kind: "cap", category: "phu-kien", sizes: FREE,
    looks: [["white", [9558927]]],
    stock: 60, sold: 211,
  },
  {
    slug: "mu-noi-tweed",
    nameVi: "Mũ nồi tweed",
    nameEn: "Tweed flat cap",
    descriptionVi: "Vải tweed len pha, form mũ nồi cổ điển cho những ngày se lạnh.",
    descriptionEn: "A classic flat cap in wool-blend tweed for cool days.",
    price: 320_000, kind: "cap", category: "phu-kien", sizes: FREE,
    looks: [["grey", [31530115]]],
    stock: 30, sold: 58, isNew: true,
  },
];
