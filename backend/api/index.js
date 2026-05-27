/**
 * Vercel serverless entry point for the Express API.
 * Do not call server.listen() — Vercel invokes this handler per request.
 */
const { app } = require("../app");
const dbConnect = require("../config/dbConfig");

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
    console.error("Vercel handler error:", err);
    if (!res.headersSent) {
      // Ensure we return CORS headers even when the DB or handler fails
      // so browsers don't block the error response with a CORS failure.
      try {
        res.setHeader(
          "Access-Control-Allow-Origin",
          process.env.CLIENT_URL || "*",
        );
        res.setHeader(
          "Access-Control-Allow-Methods",
          "GET,POST,PUT,DELETE,OPTIONS,PATCH",
        );
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization",
        );
        res.setHeader("Access-Control-Allow-Credentials", "true");
      } catch (e) {
        // ignore header set errors
      }

      res.status(503).json({
        status: "error",
        message:
          "Service temporarily unavailable. Check database configuration.",
      });
    }
  }
};
