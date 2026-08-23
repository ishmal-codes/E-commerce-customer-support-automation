'use strict';

const path = require('path');
const config = require('../config');
const { parseCustomerOrders } = require('../utils/csvParser');

/**
 * orderLookup.service.js
 * Provides order lookup from the CSV data source (Customer_Orders.csv).
 * Acts as an offline fallback / data enrichment layer alongside Shopify.
 *
 * The Shopify service (shopify.service.js) is the live source of truth.
 * This service supplements it — especially useful during testing when
 * Shopify API credentials may not be available.
 */

let _orders = null; // Cached order array

/**
 * Initialise and cache the CSV orders.
 * Called once at startup; safe to call multiple times.
 */
function initOrderData() {
  if (_orders) return _orders;

  const ordersPath = path.join(config.paths.docs, 'Customer_Orders.csv');
  try {
    _orders = parseCustomerOrders(ordersPath);
    console.log(`✅ Order data loaded: ${_orders.length} orders from CSV.`);
  } catch (err) {
    console.warn('⚠️  Could not load Customer_Orders.csv:', err.message);
    _orders = [];
  }
  return _orders;
}

/**
 * Find an order by its ID (with or without the # prefix).
 * Accepts: "#10234", "10234", "#10234 ".
 *
 * @param {string} orderId
 * @returns {object|null}
 */
function findOrderById(orderId) {
  const orders = _orders || initOrderData();
  const clean = orderId.replace(/^#/, '').trim();
  return orders.find((o) => o.orderIdClean === clean) || null;
}

/**
 * Find orders belonging to a customer by name (case-insensitive, partial match).
 *
 * @param {string} customerName
 * @returns {object[]}
 */
function findOrdersByCustomerName(customerName) {
  const orders = _orders || initOrderData();
  const lower = customerName.toLowerCase();
  return orders.filter((o) => o.customerName.toLowerCase().includes(lower));
}

/**
 * Extract order IDs mentioned in a free-text user message.
 * Patterns: #10234, order 10234, order number 10234.
 *
 * @param {string} message
 * @returns {string[]} Cleaned order IDs (no #)
 */
function extractOrderIdsFromMessage(message) {
  const patterns = [
    /#(\d{4,6})/g,                           // #10234
    /\border\s*(?:number|#|id)?[:# ]*(\d{4,6})/gi, // order 10234 / order number 10234
  ];
  const found = new Set();
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      found.add(match[1].trim());
    }
  }
  return [...found];
}

/**
 * Get full order data from the CSV cache, normalised to the format
 * the prompt builder and response layer expect.
 *
 * @param {string} orderId - Cleaned order ID (no #)
 * @returns {object|null}
 */
function getCsvOrder(orderId) {
  const raw = findOrderById(orderId);
  if (!raw) return null;

  return {
    orderId: raw.orderId,
    customerName: raw.customerName,
    products: raw.products,
    orderDate: raw.orderDate,
    status: raw.status,
    trackingNumber: raw.trackingNumber || null,
    source: 'csv',
  };
}

module.exports = {
  initOrderData,
  findOrderById,
  findOrdersByCustomerName,
  extractOrderIdsFromMessage,
  getCsvOrder,
};
