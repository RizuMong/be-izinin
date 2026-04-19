const express = require("express");
const router = express.Router();
const authMiddleware = require("../../../shared/middleware/auth");
const { 
    getAdjustments, 
    createAdjustmentTimeOffService, 
    deleteAdjustmentTimeOffService, 
    updateAdjustmentTimeOffService 
} = require("../service/adjustment-timeoff.service");

// Get Adjustments
router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await getAdjustments(req.query);
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

// Create Adjustment
router.post("/", authMiddleware, async (req, res) => {
    try {
        const data = await createAdjustmentTimeOffService(req.body);
        return res.status(200).json({
            data,
            message: "Data berhasil dibuat",
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

// Delete Adjustment
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const data = await deleteAdjustmentTimeOffService(req.params.id);
        return res.status(200).json({
            data,
            message: "Data berhasil dihapus",
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

// Update Adjustment
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const data = await updateAdjustmentTimeOffService(req.params.id, req.body);
        return res.status(200).json({
            data,
            message: "Data berhasil diupdate",
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