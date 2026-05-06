require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');
const PORT = process.env.PORT || 3000;

// Start server immediately — don't block on DB connection
const server = app.listen(PORT, () => {
  console.log(`\n🚀  Server running  →  http://localhost:${PORT}`);
  console.log(`🏥  Health check   →  http://localhost:${PORT}/api/v1/health\n`);
});

// Test DB connection in background (non-blocking)
testConnection()
  .then(() => console.log('✅  Database connection verified'))
  .catch(err => console.warn('⚠️  Database connection issue:', err.message, '(server still running)'));
