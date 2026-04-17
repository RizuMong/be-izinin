const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { getApprovalTimeOffRequests } = require("./approval.service");

router.get("/index", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const result = await getApprovalTimeOffRequests(req.query, user.email);

        return res.status(200).json({
            data: result.data,
            meta: result.meta,
            message: "Success get approval data",
            error: false
        });

    } catch (err) {
        return res.status(500).json({
            data: null,
            message: err.message,
            error: true
        });
    }
});

module.exports = router;
