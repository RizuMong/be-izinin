const { loginWithPassword } = require("../repository/auth.repository");

const loginService = async (body) => {
    const email = body.email?.trim();
    const password = body.password;

    // validation
    if (!email || !password) {
        const err = new Error("Email and password are required");
        err.status = 400;
        throw err;
    }

    const { data, error } = await loginWithPassword({ email, password });

    if (error) {
        const err = new Error("Invalid email or password");
        err.status = 401;
        throw err;
    }

    return {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: data.user,
    };
};

module.exports = {
    loginService,
};