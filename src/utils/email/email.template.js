const approvalTemplate = (name, type = "approve") => {
    return `
        <div style="font-family: Arial; padding: 20px;">
            <h2>Izinin Notification</h2>
            <p>Halo ${name},</p>
            <p>
                Ada pengajuan cuti yang menunggu 
                <b>${type}</b> Anda.
            </p>
            <br/>
            <p>Silakan login ke sistem untuk melihat detailnya.</p>
            <hr/>
            <small>Izinin System</small>
        </div>
    `;
};

const rejectTemplate = (name) => {
    return `
        <div style="font-family: Arial; padding: 20px;">
            <h2>Izinin Notification</h2>
            <p>Halo ${name},</p>
            <p>Pengajuan cuti Anda telah <b>ditolak</b>.</p>
            <hr/>
            <small>Izinin System</small>
        </div>
    `;
};

module.exports = {
    approvalTemplate,
    rejectTemplate,
};