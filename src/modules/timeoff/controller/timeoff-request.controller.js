const express = require("express");
const router = express.Router();
const authMiddleware = require("../../../shared/middleware/auth");

const { createDraftService, updateDraftService, submitService } = require("../service/submit-timeoff.service");
const { cancelService } = require("../service/cancel-timeoff.service");
const { approveService } = require("../service/approve-timeoff.service");
const { rejectService } = require("../service/reject-timeoff.service");
const { getTimeOffRequestDetailService } = require("../service/get-timeoff-request.service");
const { getAllTimeOffRequestService } = require("../service/get-timeoff-history.service");
const { getAllHistoryAdminService, getUserRequestListService } = require("../service/timeoff-summary.service");

// Get Global History (Admin View)
router.get("/history/all", authMiddleware, async (req, res) => {
    try {
        const result = await getAllHistoryAdminService(req.query);
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

// Get User Request List
router.get("/request", authMiddleware, async (req, res) => {
    try {
        const result = await getUserRequestListService(req.query, req.user.email);
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

// Get History List
router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await getAllTimeOffRequestService(req.query, req.user);
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

// Approve (Legacy)
router.put("/approve/:id", authMiddleware, async (req, res) => {
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

// Reject (Legacy)
router.put("/reject/:id", authMiddleware, async (req, res) => {
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

// Create Request (as Draft)
router.post("/", authMiddleware, async (req, res) => {
    try {
        const data = await createDraftService(req.body, req.user.email);
        return res.status(200).json({
            data,
            message: "Request created successfully",
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

// Create Draft
router.post("/draft", authMiddleware, async (req, res) => {
    try {
        const data = await createDraftService(req.body, req.user.email);
        return res.status(200).json({
            data,
            message: "Draft created successfully",
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

// Update Draft
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const data = await updateDraftService(req.params.id, req.body, req.user.email);
        return res.status(200).json({
            data,
            message: "Request updated successfully",
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

// Submit
router.put("/submit/:id", authMiddleware, async (req, res) => {
    try {
        const data = await submitService(req.params.id, req.user.email);
        return res.status(200).json({
            data,
            message: "Request submitted successfully",
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

// Cancel
router.post("/cancel/:id", authMiddleware, async (req, res) => {
    try {
        const data = await cancelService(req.params.id, req.user.email);
        return res.status(200).json({
            data,
            message: "Request cancelled successfully",
            error: false
        });
    } catch (err) {
        return res.status(err.status || 400).json({
            data: null,
            message: err.message,
            error: true
        });
    }
});

// Detail
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const data = await getTimeOffRequestDetailService(req.params.id);
        return res.status(200).json({
            data,
            message: "Request retrieved successfully",
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