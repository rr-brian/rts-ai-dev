/**
 * Server error handling configuration
 */

/**
 * Set up error handlers for the Express app
 */
function setupErrorHandlers(app) {
  // 404 handler - for routes not found
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      res.status(404).json({
        error: 'Not Found',
        message: `The requested API endpoint ${req.url} does not exist`
      });
    } else {
      // For non-API routes, let the SPA handle 404s
      next();
    }
  });
  
  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
      error: message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });
}

module.exports = { setupErrorHandlers };
