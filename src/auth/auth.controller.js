const express = require("express");
const router = express.Router();

const { loginService } = require("./auth.service");

router.post("/login", async (req, res) => {
  try {
    const result = await loginService(req.body);

    return res.status(200).json({
      data: result,
      message: "Login successful",
      error: false,
    });

  } catch (err) {
    return res.status(err.status || 500).json({
      data: null,
      message: err.message,
      error: true,
    });
  }
});

module.exports = router;