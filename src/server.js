const express = require("express");
const dotenv = require("dotenv");
const app = express();

app.use(express.json());
dotenv.config();

const PORT = process.env.PORT;

// Middleware
const authMiddleware = require("./shared/middleware/auth");

// Modules

// 1. Auth & User
const authController = require("./modules/auth/controller/auth.controller");
app.use("/auth", authController);

const userController = require("./modules/user/controller/user.controller");
app.use("/user", userController);

// 2. Master Data
const afdelingController = require("./modules/master/afdeling/controller/afdeling.controller");
app.use("/afdeling", afdelingController);

const holidayController = require("./modules/master/holiday/controller/holiday.controller");
app.use("/holiday", holidayController);

const employeeController = require("./modules/master/employee/controller/employee.controller");
app.use("/employee", employeeController);

const jobPositionController = require("./modules/master/position/controller/job-position.controller");
app.use("/job-position", jobPositionController);

const siteController = require("./modules/master/site/controller/site.controller");
app.use("/site", siteController);

const timeOffTypeController = require("./modules/master/timeoff-type/controller/time-off.controller");
app.use("/time-off", timeOffTypeController);

// 3. Time Off Feature
const timeOffEmployeeController = require("./modules/timeoff/controller/timeoff-employee.controller");
app.use("/time-off/employee", timeOffEmployeeController);

const adjustmentTimeOffController = require("./modules/timeoff/controller/timeoff-adjustment.controller");
app.use("/adjustment-time-off/employee", adjustmentTimeOffController);

const timeoffRequestController = require("./modules/timeoff/controller/timeoff-request.controller");

// Both listing and actions for requests
app.use("/time-off-request", timeoffRequestController); // Handles GET / and Actions

const approvalController = require("./modules/timeoff/controller/timeoff-approval.controller");
app.use("/time-off-approval", approvalController);


app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});