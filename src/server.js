const express = require("express");
const dotenv = require("dotenv");
const app = express();

app.use(express.json());
dotenv.config();

const PORT = process.env.PORT;

// master afdeling
const afdelingController = require("./afdeling/afdeling.controller");
app.use("/afdeling", afdelingController);

app.listen(PORT, () => {
    console.log("Express Running on PORT", PORT);
});