/**
 * Modular server entry point
 * This file is a thin wrapper around the modular server implementation
 */
const { initializeServer } = require('./server/index');

// Start the server
initializeServer()
  .then(() => {
    console.log('Server initialized successfully using modular architecture');
  })
  .catch(err => {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  });
