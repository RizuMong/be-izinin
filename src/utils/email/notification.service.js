const { sendEmail } = require("./email.service");
const {
    approvalTemplate,
    rejectTemplate,
} = require("./email.template");


const sendApprovalEmail = async (email, name) => {
    return await sendEmail({
        to: email,
        subject: "Approval Request - Izinin",
        html: approvalTemplate(name, "approval"),
    });
};

const sendRejectEmail = async (email, name) => {
    return await sendEmail({
        to: email,
        subject: "Request Ditolak - Izinin",
        html: rejectTemplate(name),
    });
};

module.exports = {
    sendApprovalEmail,
    sendRejectEmail,
};