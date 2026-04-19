const express = require("express");
const router = express.Router();
const authMiddleware = require("../../../shared/middleware/auth");

const {
    getUsersService,
    getMeService
} = require("../service/user.service");

router.get("/", authMiddleware, async (req, res) => {
    try {
        const data = await getUsersService();

        return res.status(200).json({
            data,
            message: "Users retrieved successfully",
            error: false
        });

    } catch (err) {
        return res.status(err.status || 500).json({
            data: null,
            message: err.message,
            error: true
        });
    }
});

router.get("/me", authMiddleware, async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        const token = authHeader?.replace("Bearer ", "");

        const data = await getMeService(token);

        return res.status(200).json({
            data,
            message: "User retrieved successfully",
            error: false
        });

    } catch (err) {
        return res.status(err.status || 500).json({
            data: null,
            message: err.message,
            error: true
        });
    }
});

module.exports = router;