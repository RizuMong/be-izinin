const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

console.log(process.env.EMAIL_USER);
console.log(process.env.EMAIL_PASS);


const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const info = await transporter.sendMail({
            from: `"Izinin App" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });

        return info;
    } catch (err) {
        console.error("Email error:", err.message);
        throw new Error("Gagal mengirim email");
    }
};

module.exports = {
    sendEmail,
};