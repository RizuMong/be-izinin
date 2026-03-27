const express = require("express");
const db = require("../db/index");

const router = express.Router();

const { getAfdeling, createAfdelingService, deleteAfdelingService, updateAfdelingService } = require("../afdeling/afdeling.service");

router.get("/", async (req, res) => {
    try {
        const result = await getAfdeling(req.query);

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

router.post("/", async (req, res) => {
    try {
        const data = await createAfdelingService(req.body);

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

router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const data = await deleteAfdelingService(id);

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

router.put("/:id", async (req, res) => {
    try {
        const data = await updateAfdelingService(req.params.id, req.body);

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