const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth");


const {
    getAllTimeOffRequestService,
    createDraftService,
    updateDraftService,
    submitService,
    approveService,
    rejectService
} = require("./request-time-off.service");

// list request
router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await getAllTimeOffRequestService(req.query, req.user);

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
        const data = await createDraftService(req.body);

        return res.status(200).json({
            data,
            message: "Draft berhasil dibuat",
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

// update draft
router.put("/draft/:id", authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const data = await updateDraftService(id, req.body);

        return res.status(200).json({
            data,
            message: "Draft berhasil diupdate",
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

// submit
router.put("/submit/:id", authMiddleware, async (req, res) => {
    try {
        const data = await submitService(req.params.id);

        return res.status(200).json({
            data: {},
            message: "Berhasil submit",
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
            message: "Disetujui",
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
            message: "Ditolak",
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