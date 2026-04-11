require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const testEmail = async () => {
    try {
        await transporter.verify();
        console.log("SMTP connected successfully");

        const info = await transporter.sendMail({
            from: `"Izinin Test" <${process.env.EMAIL_USER}>`,
            to: "rizkihaddiprayoga@gmail.com", 
            subject: "Test Email",
            text: "Ini adalah test email dari Izinin",
        });

        console.log("Email sent:", info.messageId);

    } catch (err) {
        console.error("SMTP error:", err.message);
    }
};

testEmail();