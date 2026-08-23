'use strict';

const morgan = require('morgan');
const config = require('../config');

/**
 * requestLogger.js
 * HTTP request logger using Morgan.
 * Dev: coloured concise output.
 * Production: JSON structured log per request for Railway log aggregation.
 */

let requestLogger;

if (config.isDev) {
  requestLogger = morgan('dev');
} else {
  // Custom JSON token for production log aggregators
  morgan.token('body-size', (req) => {
    const body = req.body;
    if (!body) return '0';
    return Buffer.byteLength(JSON.stringify(body), 'utf8').toString();
  });

  requestLogger = morgan((tokens, req, res) => {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: parseInt(tokens.status(req, res), 10),
      responseTimeMs: parseFloat(tokens['response-time'](req, res)),
      contentLength: tokens.res(req, res, 'content-length') || 0,
      userAgent: tokens['user-agent'](req, res),
      requestBodyBytes: tokens['body-size'](req, res),
      timestamp: new Date().toISOString(),
    });
  });
}

module.exports = requestLogger;
