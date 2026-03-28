const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth");

const { getATimeOffEmployee, createTimeOffEmployeeService, deleteTimeOffEmployeeService, updateTimeOffEmployeeService } = require("./time-off-employee.service");

router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await getATimeOffEmployee(req.query);

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
        const data = await createTimeOffEmployeeService(req.body);

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

        const data = await deleteTimeOffEmployeeService(id);

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
        const data = await updateTimeOffEmployeeService(req.params.id, req.body);

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