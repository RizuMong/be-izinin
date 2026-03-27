const db = require("../db");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
        error: true
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data, error } = await db.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        message: "Invalid token",
        error: true
      });
    }

    // inject user ke request
    req.user = data.user;

    next();

  } catch (err) {
    return res.status(500).json({
      message: err.message,
      error: true
    });
  }
};

module.exports = authMiddleware;