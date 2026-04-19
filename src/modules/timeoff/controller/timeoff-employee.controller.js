const express = require("express");
const router = express.Router();
const authMiddleware = require("../../../shared/middleware/auth");
const { 
    getQuotas, 
    createQuotaService, 
    updateQuotaService, 
    deleteQuotaService 
} = require("../service/quota-timeoff.service");

// Get Quotas
router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await getQuotas(req.query);
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

// Create Quota
router.post("/", authMiddleware, async (req, res) => {
    try {
        const data = await createQuotaService(req.body);
        return res.status(200).json({
            data,
            message: "Data created successfully",
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

// Update Quota
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const data = await updateQuotaService(req.params.id, req.body);
        return res.status(200).json({
            data,
            message: "Data updated successfully",
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

// Delete Quota
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const data = await deleteQuotaService(req.params.id);
        return res.status(200).json({
            data,
            message: "Data deleted successfully",
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

module.exports = router;