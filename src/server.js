const express = require("express");
const dotenv = require("dotenv");
const app = express();

app.use(express.json());
dotenv.config();

const PORT = process.env.PORT;

// auth
const authController = require("./auth/auth.controller");
app.use("/auth", authController);

// master data
const afdelingController = require("./master-afdeling/afdeling.controller");
app.use("/afdeling", afdelingController);

const holidayController = require("./master-holiday/holiday.controller");
app.use("/holiday", holidayController);

// const employeeController = require("./master-holiday/holiday.controller");
// app.use("/employee", employeeController);

const jobPositionController = require("./master-job-position/job-position.controller");
app.use("/job-position", jobPositionController);

const siteController = require("./master-site/site.controller");
app.use("/site", siteController);

const timeOffController = require("./master-time-off/time-off.controller");
app.use("/time-off", timeOffController);

// time off

app.listen(PORT, () => {
    console.log("Express Running on PORT", PORT);
});