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
const afdelingController = require("./afdeling/afdeling.controller");
app.use("/afdeling", afdelingController);

// time off

app.listen(PORT, () => {
    console.log("Express Running on PORT", PORT);
});