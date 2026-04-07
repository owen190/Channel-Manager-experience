// Wrapper around Next.js standalone server.js that injects no-cache headers.
// The standalone server doesn't respect next.config.js headers() or custom servers,
// so we monkey-patch http.ServerResponse to add headers to every non-static response.

const http = require('http');

const origWriteHead = http.ServerResponse.prototype.writeHead;
http.ServerResponse.prototype.writeHead = function (statusCode, ...args) {
  // Don't touch hashed static assets — they're immutable by URL
  const url = this.req?.url || '';
  if (!url.startsWith('/_next/static')) {
    this.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    this.setHeader('Pragma', 'no-cache');
    this.setHeader('Expires', '0');
    this.setHeader('Surrogate-Control', 'no-store');
  }
  return origWriteHead.call(this, statusCode, ...args);
};

// Now load the actual Next.js standalone server
require('./server.js');
