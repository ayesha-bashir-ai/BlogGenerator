require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`\n🚀  Server running  →  http://localhost:${PORT}`);
      console.log(`🏥  Health check   →  http://localhost:${PORT}/api/v1/health\n`);
    });
  } catch (err) {
    console.error('❌  Startup failed:', err.message);
    process.exit(1);
  }
}
start();
