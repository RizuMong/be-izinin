const express = require("express");
const router = express.Router();
const authMiddleware = require("../../../shared/middleware/auth");
const { getApprovalTimeOffRequests } = require("../service/timeoff-approval.service");
const { approveService } = require("../service/approve-timeoff.service");
const { rejectService } = require("../service/reject-timeoff.service");

// Get Pending Approval List
router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await getApprovalTimeOffRequests(req.query, req.user.email);
        return res.status(200).json({
            data: result.data,
            meta: result.meta,
            message: "Success get datas",
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

// Approve
router.post("/approve/:id", authMiddleware, async (req, res) => {
    try {
        const data = await approveService(req.params.id, req.user.email, req.body);
        return res.status(200).json({
            data,
            message: "Request approved successfully",
            error: false
        });
    } catch (err) {
        return res.status(400).json({
            data: null,
            message: err.message,
            error: true
        });
    }
});

// Reject
router.post("/reject/:id", authMiddleware, async (req, res) => {
    try {
        const data = await rejectService(req.params.id, req.user.email, req.body);
        return res.status(200).json({
            data,
            message: "Request rejected successfully",
            error: false
        });
    } catch (err) {
        return res.status(400).json({
            data: null,
            message: err.message,
            error: true
        });
    }
});

module.exports = router;