'use strict';

const config = require('../config');

/**
 * errorHandler.js
 * Global Express error-handling middleware.
 * Must be registered LAST in the Express middleware chain (4 args).
 *
 * Ensures:
 *  - Consistent JSON error shape across all routes
 *  - Stack traces only shown in development
 *  - Operational vs. programmer error distinction logged appropriately
 */

function errorHandler(err, req, res, next) {
  // Default to 500 if no status was set
  const statusCode = err.statusCode || err.status || 500;

  // Log the error server-side
  if (statusCode >= 500) {
    console.error('[ErrorHandler] Unhandled error:', err.message);
    if (config.isDev) console.error(err.stack);
  } else {
    console.warn('[ErrorHandler] Client error:', err.message);
  }

  const responseBody = {
    error: statusCode >= 500 ? 'An internal server error occurred.' : err.message,
    ...(config.isDev && { stack: err.stack }),
  };

  res.status(statusCode).json(responseBody);
}

/**
 * 404 handler — registered before errorHandler for unknown routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = { errorHandler, notFoundHandler };
