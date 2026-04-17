const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { getApprovalTimeOffRequests } = require("./approval.service");

router.get("/", authMiddleware, async (req, res) => {
    try {
        const data = await getApprovalTimeOffRequests(
            req.query,
            req.user.email
        );

        return res.status(200).json({
            data: data.data,
            meta: data.meta,
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