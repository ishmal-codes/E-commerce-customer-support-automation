module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/db/index.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "db",
    ()=>db,
    "pool",
    ()=>pool
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$node$2d$postgres$2f$driver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/node-postgres/driver.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__ = __turbopack_context__.i("[externals]/pg [external] (pg, esm_import, [project]/node_modules/pg)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$node$2d$postgres$2f$driver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$node$2d$postgres$2f$driver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ecommerce_support";
const globalForDb = globalThis;
const pool = globalForDb.__arenaNextJsPostgresqlPool ?? new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__["Pool"]({
    connectionString: databaseUrl
});
if ("TURBOPACK compile-time truthy", 1) {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
}
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$node$2d$postgres$2f$driver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["drizzle"])(pool);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/db/schema.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "chatMessages",
    ()=>chatMessages,
    "chatSessions",
    ()=>chatSessions,
    "orders",
    ()=>orders
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/boolean.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/indexes.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/integer.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/jsonb.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/table.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$serial$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/serial.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/text.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/timestamp.js [app-route] (ecmascript)");
;
const chatSessions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pgTable"])("chat_sessions", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$serial$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["serial"])("id").primaryKey(),
    token: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("token").notNull().unique(),
    context: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonb"])("context").$type().notNull().default({}),
    escalated: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["boolean"])("escalated").notNull().default(false),
    escalationRef: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("escalation_ref"),
    escalationReason: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("escalation_reason"),
    /** 'open' | 'resolved' | null */ escalationStatus: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("escalation_status"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["timestamp"])("created_at").notNull().defaultNow(),
    lastMessageAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["timestamp"])("last_message_at").notNull().defaultNow()
});
const chatMessages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pgTable"])("chat_messages", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$serial$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["serial"])("id").primaryKey(),
    sessionId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("session_id").notNull().references(()=>chatSessions.id, {
        onDelete: "cascade"
    }),
    /** 'user' | 'assistant' | 'agent' */ role: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("role").notNull(),
    content: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("content").notNull(),
    payload: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonb"])("payload").$type(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["timestamp"])("created_at").notNull().defaultNow()
}, (table)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["index"])("chat_messages_session_idx").on(table.sessionId)
    ]);
const orders = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pgTable"])("orders", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$serial$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["serial"])("id").primaryKey(),
    orderNumber: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("order_number").notNull().unique(),
    /** 'processing' | 'in_transit' | 'delivered' */ status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("status").notNull(),
    statusLabel: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("status_label").notNull(),
    carrier: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("carrier"),
    tracking: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("tracking"),
    eta: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("eta"),
    placedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("placed_at"),
    items: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonb"])("items").$type().notNull(),
    total: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("total").notNull(),
    customerEmail: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("customer_email").notNull()
});
}),
"[project]/src/lib/catalog.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Store catalog + assistant knowledge base.
 *  In the real integration this data comes from Shopify; for the demo we
 *  keep it here so the assistant answers from "store data", not guesses. */ __turbopack_context__.s([
    "POLICIES",
    ()=>POLICIES,
    "PRODUCTS",
    ()=>PRODUCTS,
    "PRODUCT_FACTS",
    ()=>PRODUCT_FACTS,
    "SEED_ORDERS",
    ()=>SEED_ORDERS
]);
const PRODUCTS = [
    {
        id: "candle",
        name: "Cedar & Smoke Candle",
        price: 42,
        blurb: "Hand-poured soy-coconut wax in amber glass. Cedarwood, smoked vetiver and a little campfire.",
        image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: "throw",
        name: "Washed Linen Throw",
        price: 96,
        blurb: "European flax, stonewashed for softness. Gets better every year you own it.",
        image: "https://images.unsplash.com/photo-1600369672770-985fd30004eb?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: "mugs",
        name: "Stoneware Mug Set",
        price: 58,
        blurb: "Set of two speckled stoneware mugs. No two glazes land exactly alike.",
        image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: "board",
        name: "Walnut Serving Board",
        price: 74,
        blurb: "Solid American walnut, finished with food-safe oil. Built for long dinners.",
        image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80"
    }
];
const PRODUCT_FACTS = {
    candle: {
        match: /candle|wax|wick|burn/i,
        name: "Cedar & Smoke Candle",
        answer: "The Cedar & Smoke Candle burns for roughly 55 hours. It's a soy-coconut wax blend with a cotton wick in amber glass. Trim the wick to ~5mm before each burn and let the first burn run about 2 hours so the wax melts evenly."
    },
    throw: {
        match: /throw|linen|blanket|flax/i,
        name: "Washed Linen Throw",
        answer: "The Washed Linen Throw is 100% European flax, 130×180cm. Machine wash cold on gentle, no bleach — it actually gets softer with every wash. It comes pre-washed, so there's no shrinkage surprise."
    },
    mugs: {
        match: /mug|cup|stoneware|ceramic/i,
        name: "Stoneware Mug Set",
        answer: "The mugs are glazed stoneware, sold as a set of two, ~350ml each. They're dishwasher and microwave safe. Because the glaze is applied by hand, each set's speckling is slightly different."
    },
    board: {
        match: /board|walnut|wood|serving/i,
        name: "Walnut Serving Board",
        answer: "The Walnut Serving Board is solid American walnut, 45×20cm. Hand-wash and dry it straight away (never the dishwasher), and rub in food-safe oil once a month to keep it happy."
    }
};
const POLICIES = {
    shipping: "We ship from our Rotterdam warehouse. Standard delivery takes 3–5 business days — free over $75, otherwise $6. Express arrives in 1–2 business days for $14. Orders placed before 3pm CET go out the same day.",
    returns: "You have 30 days from delivery to start a return — items unused, in original packaging. Refunds land 3–5 business days after the item reaches us, on the original payment method. Return labels are free."
};
const SEED_ORDERS = [
    {
        orderNumber: "TV-1042",
        status: "in_transit",
        statusLabel: "In transit",
        carrier: "DHL Express",
        tracking: "DH 2048 1739 44",
        eta: "Thu, 12 June",
        placedAt: "7 June",
        items: [
            {
                name: "Cedar & Smoke Candle",
                qty: 2
            },
            {
                name: "Washed Linen Throw",
                qty: 1
            }
        ],
        total: "$180.00",
        customerEmail: "dana.reyes@sample.shop"
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
            {
                name: "Walnut Serving Board",
                qty: 1
            },
            {
                name: "Cedar & Smoke Candle",
                qty: 1
            }
        ],
        total: "$116.00",
        customerEmail: "priya.n@sample.shop"
    },
    {
        orderNumber: "TV-1038",
        status: "delivered",
        statusLabel: "Delivered",
        carrier: "PostNL",
        tracking: "3S ABC 889 213",
        eta: "Delivered Mon, 2 June",
        placedAt: "28 May",
        items: [
            {
                name: "Stoneware Mug Set",
                qty: 1
            }
        ],
        total: "$58.00",
        customerEmail: "sam.okafor@sample.shop"
    }
];
}),
"[project]/src/db/seed.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "ensureSeeded",
    ()=>ensureSeeded
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$functions$2f$aggregate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/functions/aggregate.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/index.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$catalog$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/catalog.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
let seedChecked = false;
async function ensureSeeded() {
    if (seedChecked) return;
    try {
        const [row] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].select({
            n: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$functions$2f$aggregate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["count"])()
        }).from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["orders"]);
        if ((row?.n ?? 0) === 0) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].insert(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["orders"]).values(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$catalog$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SEED_ORDERS"].map((o)=>({
                    orderNumber: o.orderNumber,
                    status: o.status,
                    statusLabel: o.statusLabel,
                    carrier: o.carrier,
                    tracking: o.tracking,
                    eta: o.eta,
                    placedAt: o.placedAt,
                    items: [
                        ...o.items
                    ],
                    total: o.total,
                    customerEmail: o.customerEmail
                })));
        }
    } catch  {
    // Tables may not exist yet before `drizzle-kit push` — never crash the request.
    }
    seedChecked = true;
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/lib/assistant.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "runAssistant",
    ()=>runAssistant
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/index.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$catalog$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/catalog.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
const HUMAN_RE = /\b(human|real (person|human)|agent|representative|someone (real|there|helpful)|manager|talk to (a |someone)|speak to (a |someone))\b/i;
const FRUSTRATED_RE = /\b(useless|terrible|awful|horrible|scam|joke|ridiculous|furious|fed up|fed-up|complaint|complain|unacceptable|worst|disgusting)\b/i;
const REFUND_MISSING_RE = /refund.*\b(not|still|haven't|hasn't|waiting|never|weeks?)\b|\b(still|never|not).*(received|got|seen).*refund/i;
const CANCEL_RE = /\bcancel(l?ed|ing|lation)?\b/i;
const GREETING_RE = /^(hi|hey|heya|hello|good (morning|afternoon|evening)|howdy|yo)\b/i;
const THANKS_RE = /\b(thanks|thank you|cheers|appreciate it|perfect,? thanks|that's all)\b/i;
const RETURNS_RE = /\b(return|refund|exchange|send back|money back)\b/i;
const SHIPPING_RE = /\b(shipping|shipment|delivery|deliver|dispatch|ship|arrive|arrival|postage|courier|how long).*(\b|$)|\bwhen will it arrive\b/i;
const STATUS_RE = /\b(track|tracking|status|where)\b.*\b(order|package|parcel|item|it)\b|\border\b.*\b(status|track|where|when|coming|arrive)\b|\bwhere'?s my\b/i;
const STOCK_RE = /\b(in stock|available|availability|inventory|restock|stock)\b/i;
const GENERIC_PRODUCT_RE = /\b(products?|what do you (sell|have)|catalog(ue)?|collection|recommend|materials?|care instructions?|dimensions?|sizes?)\b/i;
const CONTACT_RE = /\b(hours?|contact|phone|email|address|reach you)\b/i;
const BASE_CHIPS = [
    "Track my order",
    "Shipping times",
    "Returns & refunds"
];
function parseOrderNumber(text, context) {
    const prefixed = text.match(/\b(?:tv|order)\s*#?\s*-?\s*(\d{3,6})\b/i) ?? text.match(/#\s*(?:tv\s*-?\s*)?(\d{3,6})\b/i);
    if (prefixed?.[1]) return `TV-${prefixed[1]}`;
    const bare = text.match(/\b(\d{3,6})\b/);
    if (bare?.[1] && (context.awaiting === "order_number" || /\border\b/i.test(text))) {
        return `TV-${bare[1]}`;
    }
    return null;
}
async function updateContext(session, patch) {
    const next = {
        ...session.context,
        ...patch
    };
    session.context = next;
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].update(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatSessions"]).set({
            context: next
        }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatSessions"].id, session.id));
    } catch  {
    // Database offline fallback
    }
}
async function escalate(session, reason) {
    const ref = `ESC-${1000 + session.id}`;
    session.escalated = true;
    session.escalationRef = ref;
    session.escalationReason = reason;
    session.escalationStatus = "open";
    session.context = {};
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].update(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatSessions"]).set({
            escalated: true,
            escalationRef: ref,
            escalationReason: reason,
            escalationStatus: "open",
            context: {}
        }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatSessions"].id, session.id));
    } catch  {
    // Database offline fallback
    }
    return ref;
}
function orderToCard(o) {
    return {
        orderNumber: o.orderNumber,
        status: o.status,
        statusLabel: o.statusLabel,
        carrier: o.carrier ?? undefined,
        tracking: o.tracking ?? undefined,
        eta: o.eta ?? undefined,
        placedAt: o.placedAt ?? undefined,
        items: o.items,
        total: o.total
    };
}
async function resolveOrder(session, orderNumber, text) {
    let order = null;
    try {
        const [found] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["orders"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["orders"].orderNumber, orderNumber)).limit(1);
        if (found) order = found;
    } catch  {
    // Database offline fallback: lookup in SEED_ORDERS
    }
    if (!order) {
        const seedMatch = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$catalog$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SEED_ORDERS"].find((o)=>o.orderNumber === orderNumber);
        if (seedMatch) {
            order = {
                id: 1,
                orderNumber: seedMatch.orderNumber,
                status: seedMatch.status,
                statusLabel: seedMatch.statusLabel,
                carrier: seedMatch.carrier,
                tracking: seedMatch.tracking,
                eta: seedMatch.eta,
                placedAt: seedMatch.placedAt,
                items: [
                    ...seedMatch.items
                ],
                total: seedMatch.total,
                customerEmail: seedMatch.customerEmail
            };
        }
    }
    if (!order) {
        await updateContext(session, {
            awaiting: null,
            awaitingReason: null
        });
        return {
            response: `I couldn't match ${orderNumber} to an order in this store. Double-check the number (it looks like TV-1042), or I can hand you to the care team to look it up manually.`,
            quickReplies: [
                "Talk to a human",
                ...BASE_CHIPS
            ],
            orderCard: null,
            handoffJustHappened: false
        };
    }
    const wantsReturn = RETURNS_RE.test(text) || session.context.awaitingReason === "return";
    await updateContext(session, {
        awaiting: null,
        awaitingReason: null,
        fallbackCount: 0
    });
    const card = orderToCard(order);
    if (wantsReturn) {
        if (order.status === "delivered") {
            return {
                response: `Order ${order.orderNumber} was delivered ${order.eta ?? "recently"}, so you're inside the 30-day return window. Returns are free — in the full setup I'd generate the return label right here in the chat.`,
                quickReplies: [
                    "That's all, thanks",
                    "Shipping times"
                ],
                orderCard: card,
                handoffJustHappened: false
            };
        }
        if (order.status === "in_transit") {
            return {
                response: `Order ${order.orderNumber} is still on its way (${order.eta ?? "ETA soon"}). You can start a return as soon as it's delivered — the window is 30 days from that date.`,
                quickReplies: [
                    "Track my order",
                    "That's all, thanks"
                ],
                orderCard: card,
                handoffJustHappened: false
            };
        }
        return {
            response: `Order ${order.orderNumber} hasn't shipped yet, so a return isn't needed — but if you'd like to change or cancel it, that needs the care team. Want me to flag them?`,
            quickReplies: [
                "Talk to a human",
                "Keep the order, thanks"
            ],
            orderCard: card,
            handoffJustHappened: false
        };
    }
    const opener = order.status === "delivered" ? `Here's what I found for order ${order.orderNumber} — it arrived ${order.eta ?? "recently"}.` : order.status === "processing" ? `Here's what I found for order ${order.orderNumber} — it's still being prepared${order.eta ? ` (${order.eta})` : ""}.` : `Here's what I found for order ${order.orderNumber} — it's ${order.statusLabel.toLowerCase()} with ${order.carrier ?? "the carrier"}${order.eta ? `, expected ${order.eta}` : ""}.`;
    return {
        response: opener,
        quickReplies: [
            "Start a return",
            "Shipping times",
            "That's all, thanks"
        ],
        orderCard: card,
        handoffJustHappened: false
    };
}
async function runAssistant(session, rawText) {
    const text = rawText.trim();
    const context = session.context ?? {};
    // 1. Already handed off to a human → everything goes to the care team.
    if (session.escalated && session.escalationStatus === "open") {
        return {
            response: `Thanks — that's gone straight to the care team and they'll reply right here in the chat. Your reference is ${session.escalationRef ?? "on file"}.`,
            quickReplies: [],
            orderCard: null,
            handoffJustHappened: false
        };
    }
    // 2. Explicit or emotional handoff triggers.
    if (HUMAN_RE.test(text)) {
        const ref = await escalate(session, "Customer asked for a human specialist.");
        return {
            response: `Of course — I've flagged this for a human specialist (reference ${ref}). Someone from the care team takes over from here; anything you type now goes to them.`,
            quickReplies: [],
            orderCard: null,
            handoffJustHappened: true,
            escalationReason: "Customer asked for a human specialist."
        };
    }
    if (FRUSTRATED_RE.test(text)) {
        const ref = await escalate(session, "Customer seems frustrated — priority handoff.");
        return {
            response: `I'm sorry this has been a bad experience. I've flagged it as priority for a human specialist (reference ${ref}) — they'll take it from here in this same chat.`,
            quickReplies: [],
            orderCard: null,
            handoffJustHappened: true,
            escalationReason: "Customer seems frustrated — priority handoff."
        };
    }
    if (REFUND_MISSING_RE.test(text)) {
        const ref = await escalate(session, "Missing refund — needs payment specialist.");
        return {
            response: `A missing refund needs a payment specialist, so I've flagged this for the team (reference ${ref}). They can see everything you've typed here and will reply in this chat.`,
            quickReplies: [],
            orderCard: null,
            handoffJustHappened: true,
            escalationReason: "Missing refund — needs payment specialist."
        };
    }
    if (CANCEL_RE.test(text)) {
        const ref = await escalate(session, "Order change/cancellation request.");
        return {
            response: `Order changes go through the care team, so I've flagged this for them (reference ${ref}). They'll reply here shortly — anything else you type reaches them too.`,
            quickReplies: [],
            orderCard: null,
            handoffJustHappened: true,
            escalationReason: "Order change/cancellation request."
        };
    }
    // 3. Small talk — keep it short and honest.
    if (GREETING_RE.test(text) && text.length < 40) {
        return {
            response: "Hi! I'm Aurel's support assistant. I can look up order status, explain shipping and returns, or answer product questions — all from the store's live data. What can I check for you?",
            quickReplies: [
                "Track my order",
                "Shipping times",
                "Returns & refunds",
                "Product questions"
            ],
            orderCard: null,
            handoffJustHappened: false
        };
    }
    if (THANKS_RE.test(text) && text.length < 60) {
        return {
            response: "Anytime! If anything else comes up, I'm right here — and a human can take over at any point.",
            quickReplies: BASE_CHIPS,
            orderCard: null,
            handoffJustHappened: false
        };
    }
    if (/keep the order/i.test(text)) {
        return {
            response: "All good — the order stays as it is. Anything else I can look up?",
            quickReplies: BASE_CHIPS,
            orderCard: null,
            handoffJustHappened: false
        };
    }
    // 4. An order number is present → straight lookup.
    const orderNumber = parseOrderNumber(text, context);
    if (orderNumber) {
        const resolved = await resolveOrder(session, orderNumber, text);
        if (resolved) return resolved;
    }
    // 5. We asked for an order number but didn't get one.
    if (context.awaiting === "order_number") {
        await updateContext(session, {
            awaiting: null,
            awaitingReason: null
        });
        return {
            response: "No worries — whenever you have it, your order number looks like TV-1042 (it's in your confirmation email). Or pick one of the demo orders below.",
            quickReplies: [
                "TV-1042",
                "TV-1051",
                "TV-1038",
                "Talk to a human"
            ],
            orderCard: null,
            handoffJustHappened: false
        };
    }
    // 6. "Check my return window" chip.
    if (/check (my )?return window/i.test(text)) {
        await updateContext(session, {
            awaiting: "order_number",
            awaitingReason: "return"
        });
        return {
            response: "Happy to check that. What's the order number?",
            quickReplies: [
                "TV-1042",
                "TV-1051",
                "TV-1038"
            ],
            orderCard: null,
            handoffJustHappened: false
        };
    }
    // 7. Policy intents.
    if (RETURNS_RE.test(text)) {
        await updateContext(session, {
            fallbackCount: 0
        });
        return {
            response: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$catalog$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["POLICIES"].returns,
            quickReplies: [
                "Check my return window",
                "Shipping times",
                "Talk to a human"
            ],
            orderCard: null,
            handoffJustHappened: false
        };
    }
    if (SHIPPING_RE.test(text)) {
        await updateContext(session, {
            fallbackCount: 0
        });
        return {
            response: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$catalog$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["POLICIES"].shipping,
            quickReplies: [
                "Track my order",
                "Start a return"
            ],
            orderCard: null,
            handoffJustHappened: false
        };
    }
    // 8. Order status without a number → ask once.
    if (STATUS_RE.test(text)) {
        await updateContext(session, {
            awaiting: "order_number",
            awaitingReason: "status",
            fallbackCount: 0
        });
        return {
            response: "Let me look that up. What's the order number? It looks like TV-1042 and it's in your confirmation email — or pick a demo order below.",
            quickReplies: [
                "TV-1042",
                "TV-1051",
                "TV-1038"
            ],
            orderCard: null,
            handoffJustHappened: false
        };
    }
    // 9. Product questions — from catalog data.
    if (STOCK_RE.test(text)) {
        await updateContext(session, {
            fallbackCount: 0
        });
        const matchingProducts = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$catalog$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PRODUCTS"].filter((p)=>new RegExp(p.id + "|" + p.name.split(" ")[0], "i").test(text));
        let stockAnswer;
        if (matchingProducts.length === 1) {
            stockAnswer = `Yes, the ${matchingProducts[0].name} is in stock ($${matchingProducts[0].price}).`;
        } else if (matchingProducts.length > 1) {
            stockAnswer = `Yes, both are in stock.`;
        } else {
            stockAnswer = `Yes, all items in the collection are currently in stock and ready to ship.`;
        }
        return {
            response: stockAnswer,
            quickReplies: [
                "Track my order",
                "Shipping times",
                "Returns & refunds"
            ],
            orderCard: null,
            handoffJustHappened: false
        };
    }
    for (const fact of Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$catalog$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PRODUCT_FACTS"])){
        if (fact.match.test(text)) {
            await updateContext(session, {
                fallbackCount: 0
            });
            return {
                response: fact.answer,
                quickReplies: [
                    "Track my order",
                    "Start a return",
                    "That's all, thanks"
                ],
                orderCard: null,
                handoffJustHappened: false
            };
        }
    }
    if (GENERIC_PRODUCT_RE.test(text)) {
        await updateContext(session, {
            fallbackCount: 0
        });
        const names = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$catalog$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PRODUCTS"].map((p)=>p.name);
        return {
            response: `Right now the collection is four pieces: ${names[0]}, ${names[1]}, ${names[2]} and ${names[3]}. Ask me about any of them — materials, care, dimensions — and I'll pull the details from the catalog.`,
            quickReplies: names,
            orderCard: null,
            handoffJustHappened: false
        };
    }
    // 10. Store contact info.
    if (CONTACT_RE.test(text)) {
        await updateContext(session, {
            fallbackCount: 0
        });
        return {
            response: "The care team answers here in this chat every day 9:00–18:00 CET. Email works too — care@aurelhome.shop — with a reply within one business day. If it's about an order, chatting here is fastest.",
            quickReplies: [
                "Track my order",
                "Talk to a human"
            ],
            orderCard: null,
            handoffJustHappened: false
        };
    }
    // 11. Fallback — honest about not knowing, escalates on the 2nd miss.
    const misses = (context.fallbackCount ?? 0) + 1;
    if (misses >= 2) {
        const ref = await escalate(session, "Assistant couldn't answer confidently twice in a row.");
        return {
            response: `I don't want to guess and give you the wrong answer, so I've flagged this for a human specialist (reference ${ref}). They'll pick it up right here in the chat.`,
            quickReplies: [],
            orderCard: null,
            handoffJustHappened: true,
            escalationReason: "Assistant couldn't answer confidently twice in a row."
        };
    }
    await updateContext(session, {
        fallbackCount: misses
    });
    return {
        response: "I want to be accurate rather than guess, so I'm not sure about that one. Could you rephrase it, or pick one of these? And I can get a human any time you like.",
        quickReplies: [
            "Track my order",
            "Shipping times",
            "Returns & refunds",
            "Talk to a human"
        ],
        orderCard: null,
        handoffJustHappened: false
    };
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/lib/chat-store.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "appendMessage",
    ()=>appendMessage,
    "buildTranscript",
    ()=>buildTranscript,
    "getOrCreateSession",
    ()=>getOrCreateSession,
    "sleep",
    ()=>sleep
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$select$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/select.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/index.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
function sleep(ms) {
    return new Promise((resolve)=>setTimeout(resolve, ms));
}
// In-memory fallback stores when database is unreachable
const memorySessions = new Map();
const memoryMessages = new Map();
let memMsgIdCounter = 1;
let memSessionIdCounter = 1;
async function getOrCreateSession(token) {
    try {
        const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatSessions"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatSessions"].token, token)).limit(1);
        const found = existing[0];
        if (found) return found;
        try {
            const created = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].insert(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatSessions"]).values({
                token
            }).returning();
            return created[0];
        } catch  {
            const retry = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatSessions"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatSessions"].token, token)).limit(1);
            if (retry[0]) return retry[0];
        }
    } catch  {
    // Database offline / unreachable fallback to in-memory store
    }
    // Memory fallback
    if (memorySessions.has(token)) {
        return memorySessions.get(token);
    }
    const newSession = {
        id: memSessionIdCounter++,
        token,
        context: {},
        escalated: false,
        escalationRef: null,
        escalationReason: null,
        escalationStatus: "none",
        createdAt: new Date(),
        lastMessageAt: new Date()
    };
    memorySessions.set(token, newSession);
    return newSession;
}
async function appendMessage(sessionId, role, content, payload) {
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].insert(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatMessages"]).values({
            sessionId,
            role,
            content,
            payload: payload ?? null
        });
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].update(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatSessions"]).set({
            lastMessageAt: new Date()
        }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatSessions"].id, sessionId));
    } catch  {
    // Database offline / unreachable fallback
    }
    // Always keep in-memory backup
    if (!memoryMessages.has(sessionId)) {
        memoryMessages.set(sessionId, []);
    }
    memoryMessages.get(sessionId).push({
        id: memMsgIdCounter++,
        sessionId,
        role,
        content,
        payload: payload ?? null,
        createdAt: new Date()
    });
}
async function buildTranscript(token) {
    try {
        const [session] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatSessions"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatSessions"].token, token)).limit(1);
        if (session) {
            const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatMessages"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatMessages"].sessionId, session.id)).orderBy((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$select$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["asc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chatMessages"].id));
            return {
                sessionId: token,
                escalated: session.escalated && session.escalationStatus !== "resolved",
                escalationRef: session.escalationRef,
                messages: rows.map((m)=>({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        createdAt: m.createdAt.toISOString(),
                        orderCard: m.payload?.orderCard ?? null
                    }))
            };
        }
    } catch  {
    // Database offline fallback
    }
    const memSession = memorySessions.get(token);
    if (!memSession) {
        return {
            sessionId: token,
            escalated: false,
            escalationRef: null,
            messages: []
        };
    }
    const memRows = memoryMessages.get(memSession.id) ?? [];
    return {
        sessionId: token,
        escalated: memSession.escalated && memSession.escalationStatus !== "resolved",
        escalationRef: memSession.escalationRef,
        messages: memRows.map((m)=>({
                id: m.id,
                role: m.role,
                content: m.content,
                createdAt: m.createdAt.toISOString(),
                orderCard: m.payload?.orderCard ?? null
            }))
    };
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/app/api/chat/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/seed.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$assistant$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/assistant.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chat$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/chat-store.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$assistant$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chat$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$assistant$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chat$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
const dynamic = "force-dynamic";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
async function POST(req) {
    let body;
    try {
        body = await req.json();
    } catch  {
        return Response.json({
            error: "Invalid JSON body."
        }, {
            status: 400
        });
    }
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    if (!message) {
        return Response.json({
            error: "message is required."
        }, {
            status: 400
        });
    }
    if (!sessionId) {
        return Response.json({
            error: "sessionId is required."
        }, {
            status: 400
        });
    }
    if (message.length > 1500) {
        return Response.json({
            error: "Message too long."
        }, {
            status: 400
        });
    }
    // 1. Ensure seed/session state
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ensureSeeded"])();
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chat$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getOrCreateSession"])(sessionId);
    // Persist the customer's message
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chat$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appendMessage"])(session.id, "user", message);
    // 2. Try calling Express backend server if running
    try {
        const controller = new AbortController();
        const timer = setTimeout(()=>controller.abort(), 3000);
        const res = await fetch(`${BACKEND_URL}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message,
                sessionId
            }),
            signal: controller.signal
        });
        clearTimeout(timer);
        if (res.ok) {
            const data = await res.json();
            const responseText = data && typeof data.response === "string" ? data.response : data && data.text ? String(data.text) : "";
            if (responseText) {
                const escalated = Boolean(data.escalated);
                let handoffJustHappened = false;
                if (escalated && !session.escalated) {
                    handoffJustHappened = true;
                    session.escalated = true;
                    session.escalationRef = `ESC-${1000 + session.id}`;
                    session.escalationStatus = "open";
                }
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chat$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appendMessage"])(session.id, "assistant", responseText);
                const payload = {
                    response: responseText,
                    escalated,
                    handoffJustHappened,
                    escalationRef: session.escalationRef ?? null,
                    quickReplies: [
                        "Track my order",
                        "Shipping times",
                        "Returns & refunds",
                        "Talk to a human"
                    ],
                    orderCard: null
                };
                // Return immediately — do not run secondary fallback logic
                return Response.json(payload);
            }
        }
    } catch  {
    // Backend offline / booting up — fall back to local assistant engine below
    }
    // 3. Fallback to local assistant engine only when backend is unavailable
    const outcome = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$assistant$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["runAssistant"])(session, message);
    const responseText = outcome.response;
    const escalated = session.escalated && session.escalationStatus !== "resolved";
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chat$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appendMessage"])(session.id, "assistant", responseText, {
        orderCard: outcome.orderCard ?? undefined
    });
    // Small natural delay so typing indicator reads smoothly
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chat$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sleep"])(350 + Math.random() * 300);
    const payload = {
        response: responseText,
        escalated,
        handoffJustHappened: outcome.handoffJustHappened,
        escalationRef: session.escalationRef ?? null,
        quickReplies: outcome.quickReplies,
        orderCard: outcome.orderCard
    };
    return Response.json(payload);
}
async function GET(req) {
    const sessionId = req.nextUrl.searchParams.get("sessionId") ?? "";
    if (!sessionId) {
        return Response.json({
            error: "sessionId is required."
        }, {
            status: 400
        });
    }
    const transcript = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chat$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildTranscript"])(sessionId);
    return Response.json(transcript);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__137tmt8._.js.map