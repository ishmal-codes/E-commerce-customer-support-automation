'use strict';

const axios = require('axios');
const config = require('../config');

/**
 * shopify.service.js
 * Wraps Shopify Admin REST API calls for order and product lookups.
 *
 * Scopes required (already enabled on the token):
 *   read_orders, read_products, read_customers
 *
 * All functions return normalised objects — callers never touch raw Shopify JSON.
 */

const BASE_URL = `https://${config.shopify.storeDomain}/admin/api/${config.shopify.apiVersion}`;

/** Axios instance pre-configured with auth headers */
const shopifyClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-Shopify-Access-Token': config.shopify.adminApiToken,
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
});

/**
 * Check whether the Shopify token is configured.
 * We degrade gracefully if not — CSV data is used instead.
 */
function isShopifyConfigured() {
  return Boolean(config.shopify.adminApiToken);
}

/**
 * Normalise a raw Shopify order object into the shape our app uses.
 *
 * @param {object} shopifyOrder
 * @returns {object}
 */
function normaliseOrder(shopifyOrder) {
  const lineItems = (shopifyOrder.line_items || [])
    .map((li) => `${li.title}${li.variant_title ? ` (${li.variant_title})` : ''} × ${li.quantity}`)
    .join('; ');

  const tracking = shopifyOrder.fulfillments?.flatMap((f) => f.tracking_numbers || []) ?? [];
  const trackingUrls = shopifyOrder.fulfillments?.flatMap((f) => f.tracking_urls || []) ?? [];

  return {
    orderId: shopifyOrder.name,                           // e.g. "#10234"
    orderIdClean: shopifyOrder.name.replace(/^#/, ''),
    customerName: shopifyOrder.customer
      ? `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`.trim()
      : 'Guest',
    customerEmail: shopifyOrder.email || null,
    products: lineItems || 'Unknown',
    orderDate: shopifyOrder.created_at
      ? new Date(shopifyOrder.created_at).toLocaleDateString('en-US')
      : 'Unknown',
    status: mapFulfillmentStatus(shopifyOrder.fulfillment_status, shopifyOrder.financial_status),
    fulfillmentStatus: shopifyOrder.fulfillment_status || 'unfulfilled',
    financialStatus: shopifyOrder.financial_status || 'unknown',
    trackingNumber: tracking[0] || null,
    trackingNumbers: tracking,
    trackingUrls,
    tags: shopifyOrder.tags || '',
    note: shopifyOrder.note || null,
    source: 'shopify',
  };
}

/**
 * Map Shopify's dual-status system to a human-readable single status.
 * @param {string|null} fulfillment
 * @param {string|null} financial
 * @returns {string}
 */
function mapFulfillmentStatus(fulfillment, financial) {
  if (financial === 'refunded') return 'Refunded';
  if (financial === 'partially_refunded') return 'Partially Refunded';
  if (!fulfillment || fulfillment === 'unfulfilled') return 'Processing';
  if (fulfillment === 'partial') return 'Partially Shipped';
  if (fulfillment === 'fulfilled') return 'Shipped / Fulfilled';
  if (fulfillment === 'restocked') return 'Returned & Restocked';
  return fulfillment.charAt(0).toUpperCase() + fulfillment.slice(1);
}

/**
 * Look up an order by its Shopify order name (e.g. "#10234" or "10234").
 *
 * @param {string} orderId
 * @returns {Promise<object|null>}
 */
async function getOrderById(orderId) {
  if (!isShopifyConfigured()) return null;

  const name = orderId.startsWith('#') ? orderId : `#${orderId}`;

  try {
    const response = await shopifyClient.get('/orders.json', {
      params: {
        name,
        status: 'any',
        fields: 'id,name,email,created_at,fulfillment_status,financial_status,line_items,fulfillments,customer,tags,note',
        limit: 1,
      },
    });

    const orders = response.data.orders;
    if (!orders || orders.length === 0) return null;
    return normaliseOrder(orders[0]);
  } catch (err) {
    console.error(`[Shopify] getOrderById failed for ${orderId}:`, err.message);
    return null;
  }
}

/**
 * Look up orders associated with a customer email address.
 *
 * @param {string} email
 * @returns {Promise<object[]>}
 */
async function getOrdersByEmail(email) {
  if (!isShopifyConfigured()) return [];

  try {
    const response = await shopifyClient.get('/orders.json', {
      params: {
        email,
        status: 'any',
        fields: 'id,name,email,created_at,fulfillment_status,financial_status,line_items,fulfillments,customer,tags,note',
        limit: 5,
      },
    });

    return (response.data.orders || []).map(normaliseOrder);
  } catch (err) {
    console.error(`[Shopify] getOrdersByEmail failed for ${email}:`, err.message);
    return [];
  }
}

/**
 * Fetch products from Shopify, optionally filtered by title keyword.
 *
 * @param {string} [titleQuery]
 * @returns {Promise<object[]>}
 */
async function getProducts(titleQuery = '') {
  if (!isShopifyConfigured()) return [];

  try {
    const params = {
      fields: 'id,title,handle,status,variants,product_type,tags,body_html',
      limit: 20,
    };
    if (titleQuery) params.title = titleQuery;

    const response = await shopifyClient.get('/products.json', { params });
    const products = response.data.products || [];

    return products.map((p) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      description: p.body_html?.replace(/<[^>]+>/g, '') || '',
      type: p.product_type,
      tags: p.tags,
      variants: (p.variants || []).map((v) => ({
        id: v.id,
        sku: v.sku,
        title: v.title,
        price: parseFloat(v.price),
        inventory: v.inventory_quantity,
        color: v.option1 || '',
        storage: v.option2 || '',
      })),
      source: 'shopify',
    }));
  } catch (err) {
    console.error(`[Shopify] getProducts failed:`, err.message);
    return [];
  }
}

/**
 * Verify the Shopify connection by fetching the shop details.
 * Used in the health check.
 *
 * @returns {Promise<{ connected: boolean, shopName: string|null }>}
 */
async function checkShopifyConnection() {
  if (!isShopifyConfigured()) {
    return { connected: false, shopName: null, reason: 'No API token configured' };
  }

  try {
    const response = await shopifyClient.get('/shop.json', {
      params: { fields: 'id,name,domain' },
    });
    return { connected: true, shopName: response.data.shop?.name || null };
  } catch (err) {
    return { connected: false, shopName: null, reason: err.message };
  }
}

module.exports = {
  getOrderById,
  getOrdersByEmail,
  getProducts,
  checkShopifyConnection,
  isShopifyConfigured,
};
