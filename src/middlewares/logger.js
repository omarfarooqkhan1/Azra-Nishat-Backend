const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.id : null,
    sessionId: req.sessionID || null
  });

  // Capture response status and listen for response finish
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      contentLength: body && Buffer.byteLength(body, 'utf8'),
      durationMs: duration,
      userId: req.user ? req.user.id : null
    });
    
    originalSend.call(this, body);
  };
  
  // Handle errors
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      logger.warn('Request finished with error status', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        userId: req.user ? req.user.id : null
      });
    }
  });
  
  next();
};

module.exports = { requestLogger };