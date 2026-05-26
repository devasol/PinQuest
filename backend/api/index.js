/**
 * Vercel serverless entry point for the Express API.
 * Do not call server.listen() — Vercel invokes this handler per request.
 */
const { app } = require('../app');
const dbConnect = require('../config/dbConfig');

let dbReadyPromise = null;

const ensureDb = () => {
  if (!dbReadyPromise) {
    dbReadyPromise = dbConnect().catch((err) => {
      dbReadyPromise = null;
      throw err;
    });
  }
  return dbReadyPromise;
};

module.exports = async (req, res) => {
  try {
    await ensureDb();
    return app(req, res);
  } catch (err) {
    console.error('Vercel handler error:', err);
    if (!res.headersSent) {
      res.status(503).json({
        status: 'error',
        message: 'Service temporarily unavailable. Check database configuration.',
      });
    }
  }
};
