const express = require("express");

const router = express.Router();

const { getJobPosition, createJobPositionService, deleteJobPositionService, updateJobPositionService } = require("./job-position.service");
const authMiddleware = require("../middleware/auth");

router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await getJobPosition(req.query);

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

router.post("/", authMiddleware, async (req, res) => {
    try {
        const data = await createJobPositionService(req.body);

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

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const data = await deleteJobPositionService(id);

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

router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const data = await updateJobPositionService(req.params.id, req.body);

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