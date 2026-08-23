/** Store catalog + assistant knowledge base.
 *  In the real integration this data comes from Shopify; for the demo we
 *  keep it here so the assistant answers from "store data", not guesses. */

export type Product = {
  id: string;
  name: string;
  price: number;
  blurb: string;
  image: string;
  tag?: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "candle",
    name: "Cedar & Smoke Candle",
    price: 42,
    blurb: "Hand-poured soy-coconut wax in amber glass. Cedarwood, smoked vetiver and a little campfire.",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "throw",
    name: "Washed Linen Throw",
    price: 96,
    blurb: "European flax, stonewashed for softness. Gets better every year you own it.",
    image: "https://images.unsplash.com/photo-1600369672770-985fd30004eb?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "mugs",
    name: "Stoneware Mug Set",
    price: 58,
    blurb: "Set of two speckled stoneware mugs. No two glazes land exactly alike.",
    image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "board",
    name: "Walnut Serving Board",
    price: 74,
    blurb: "Solid American walnut, finished with food-safe oil. Built for long dinners.",
    image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80",
  },
];

/** Product questions the assistant can answer from catalog data. */
export const PRODUCT_FACTS: Record<
  string,
  { match: RegExp; name: string; answer: string }
> = {
  candle: {
    match: /candle|wax|wick|burn/i,
    name: "Cedar & Smoke Candle",
    answer:
      "The Cedar & Smoke Candle burns for roughly 55 hours. It's a soy-coconut wax blend with a cotton wick in amber glass. Trim the wick to ~5mm before each burn and let the first burn run about 2 hours so the wax melts evenly.",
  },
  throw: {
    match: /throw|linen|blanket|flax/i,
    name: "Washed Linen Throw",
    answer:
      "The Washed Linen Throw is 100% European flax, 130×180cm. Machine wash cold on gentle, no bleach — it actually gets softer with every wash. It comes pre-washed, so there's no shrinkage surprise.",
  },
  mugs: {
    match: /mug|cup|stoneware|ceramic/i,
    name: "Stoneware Mug Set",
    answer:
      "The mugs are glazed stoneware, sold as a set of two, ~350ml each. They're dishwasher and microwave safe. Because the glaze is applied by hand, each set's speckling is slightly different.",
  },
  board: {
    match: /board|walnut|wood|serving/i,
    name: "Walnut Serving Board",
    answer:
      "The Walnut Serving Board is solid American walnut, 45×20cm. Hand-wash and dry it straight away (never the dishwasher), and rub in food-safe oil once a month to keep it happy.",
  },
};

export const POLICIES = {
  shipping:
    "We ship from our Rotterdam warehouse. Standard delivery takes 3–5 business days — free over $75, otherwise $6. Express arrives in 1–2 business days for $14. Orders placed before 3pm CET go out the same day.",
  returns:
    "You have 30 days from delivery to start a return — items unused, in original packaging. Refunds land 3–5 business days after the item reaches us, on the original payment method. Return labels are free.",
};

/** Sample orders used to seed the demo database. */
export const SEED_ORDERS = [
  {
    orderNumber: "TV-1042",
    status: "in_transit",
    statusLabel: "In transit",
    carrier: "DHL Express",
    tracking: "DH 2048 1739 44",
    eta: "Thu, 12 June",
    placedAt: "7 June",
    items: [
      { name: "Cedar & Smoke Candle", qty: 2 },
      { name: "Washed Linen Throw", qty: 1 },
    ],
    total: "$180.00",
    customerEmail: "dana.reyes@sample.shop",
  },
  {
    orderNumber: "TV-1051",
    status: "processing",
    statusLabel: "Being prepared",
    carrier: null,
    tracking: null,
    eta: "Ships within 1–2 business days",
    placedAt: "10 June",
    items: [
      { name: "Walnut Serving Board", qty: 1 },
      { name: "Cedar & Smoke Candle", qty: 1 },
    ],
    total: "$116.00",
    customerEmail: "priya.n@sample.shop",
  },
  {
    orderNumber: "TV-1038",
    status: "delivered",
    statusLabel: "Delivered",
    carrier: "PostNL",
    tracking: "3S ABC 889 213",
    eta: "Delivered Mon, 2 June",
    placedAt: "28 May",
    items: [{ name: "Stoneware Mug Set", qty: 1 }],
    total: "$58.00",
    customerEmail: "sam.okafor@sample.shop",
  },
] as const;
