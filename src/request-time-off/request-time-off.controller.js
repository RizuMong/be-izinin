const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth");


const {
    getAllTimeOffRequestService,
    createDraftService,
    updateDraftService,
    submitService,
    cancelService, 
    approveService,
    rejectService
} = require("./request-time-off.service");

// list request
router.get("/", authMiddleware, async (req, res) => {
    try {
        var user = req.user;
        const result = await getAllTimeOffRequestService(req.query, user);

        return res.status(200).json({
            data: result.data,
            meta: result.meta,
            message: "Success get data",
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

// create draft
router.post("/", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const data = await createDraftService(req.body, user.email);

        return res.status(200).json({
            data,
            message: "Success create draft",
            error: false
        });

    } catch (err) {
        if (err.code === "TIMEOFF_DATE_CONFLICT") {
            return res.status(400).json({
                success: false,
                message: err.message,
                code: err.code,
                data: err.conflictData
            });
        }
        return res.status(400).json({
            data: null,
            message: err.message,
            error: true
        });
    }
});

// update draft
router.put("/draft/:id", authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const user = req.user;

        const data = await updateDraftService(id, req.body, user.email);

        return res.status(200).json({
            data,
            message: "Success update draft",
            error: false
        });

    } catch (err) {
        if (err.code === "TIMEOFF_DATE_CONFLICT") {
            return res.status(400).json({
                success: false,
                message: err.message,
                code: err.code,
                data: err.conflictData
            });
        }
        return res.status(400).json({
            data: null,
            message: err.message,
            error: true
        });
    }
});

// submit
router.put("/submit/:id", authMiddleware, async (req, res) => {
    try {
        const data = await submitService(req.params.id, req.user.email);

        return res.status(200).json({
            data: {},
            message: "Success submit request",
            error: false
        });

    } catch (err) {
        if (err.code === "TIMEOFF_DATE_CONFLICT") {
            return res.status(400).json({
                success: false,
                message: err.message,
                code: err.code,
                data: err.conflictData
            });
        }
        return res.status(400).json({
            data: null,
            message: err.message,
            error: true
        });
    }
});

// cancel
router.put("/cancel/:id", authMiddleware, async (req, res) => {
    try {
        const data = await cancelService(req.params.id, req.user.email);

        return res.status(200).json({
            data: {},
            message: "Success cancel request",
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

// approve
router.put("/approve/:id", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const body = req.body;
        const data = await approveService(req.params.id, user.email, body);

        return res.status(200).json({
            data: data.data,
            message: "Success approve request",
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

// reject
router.put("/reject/:id", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const body = req.body;
        const data = await rejectService(req.params.id, user.email, body);

        return res.status(200).json({
            data: data.data,
            message: "Success reject request",
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