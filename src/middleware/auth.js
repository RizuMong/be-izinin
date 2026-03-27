const db = require("../db");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization token is required",
        error: true
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid authorization format",
        error: true
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data, error } = await db.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        message: "Invalid or expired token",
        error: true
      });
    }

    req.user = data.user;

    next();

  } catch (err) {
    return res.status(500).json({
      message: "Authentication failed",
      error: true
    });
  }
};

module.exports = authMiddleware;