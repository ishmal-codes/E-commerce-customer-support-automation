'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

/**
 * csvParser.js
 * Synchronously parses the two CSV data sources at startup.
 * Returns plain JS arrays/objects so other services can use them directly.
 */

/**
 * Parse product_catalog.csv into an array of product variant objects.
 * The CSV uses Shopify's multi-row-per-variant export format:
 * the first row of each product has the Title, Description, etc.;
 * subsequent variant rows leave those fields empty.
 * We "fill down" the product-level fields so every variant record is self-contained.
 */
function parseProductCatalog(filePath) {
  // Strip UTF-8 BOM (\uFEFF) that Excel/Shopify exports prepend to the first column header
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const products = [];
  let currentProduct = null;

  for (const row of rows) {
    // A new product starts when the Title column is populated
    // Handle BOM-prefixed key as a safety net (should be stripped above)
    const titleValue = row['Title'] || row['\uFEFFTitle'] || '';
    const isNewProduct = titleValue && titleValue.trim() !== '';

    if (isNewProduct) {
      currentProduct = {
        title: titleValue.trim(),
        handle: row['URL handle']?.trim() || '',
        description: row['Description']?.trim() || '',
        vendor: row['Vendor']?.trim() || 'Apple',
        type: row['Type']?.trim() || '',
        tags: row['Tags']?.trim() || '',
        status: row['Status']?.trim() || 'Active',
        variants: [],
      };
      products.push(currentProduct);
    }

    if (!currentProduct) continue;

    // Each row (first and subsequent) represents a variant
    const variant = {
      sku: row['SKU']?.trim() || '',
      barcode: row['Barcode']?.trim() || '',
      color: row['Option1 value']?.trim() || '',
      storage: row['Option2 value']?.trim() || '',
      price: parseFloat(row['Price']) || 0,
      compareAtPrice: parseFloat(row['Compare-at price']) || 0,
      inventory: parseInt(row['Inventory quantity'], 10) || 0,
      continueSellingWhenOutOfStock: row['Continue selling when out of stock'] === 'true',
    };

    currentProduct.variants.push(variant);
  }

  return products;
}

/**
 * Parse Customer_Orders.csv into an array of order objects.
 * This is used as a supplemental / offline data source alongside the Shopify API.
 */
function parseCustomerOrders(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return rows.map((row) => ({
    orderId: (row['Order ID'] || '').trim(),
    // Normalise to no-hash for easy comparison: "#10234" → "10234"
    orderIdClean: (row['Order ID'] || '').replace(/^#/, '').trim(),
    customerName: (row['Customer Name'] || '').trim(),
    products: (row["Product(s) Ordered"] || '').trim(),
    orderDate: (row['Order Date'] || '').trim(),
    status: (row['Status'] || '').trim(),
    trackingNumber: (row['Tracking Number'] || '').trim(),
  }));
}

module.exports = { parseProductCatalog, parseCustomerOrders };
