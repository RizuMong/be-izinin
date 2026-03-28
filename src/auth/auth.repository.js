const db = require("../db");

const loginWithPassword = async ({ email, password }) => {
  return await db.auth.signInWithPassword({
    email,
    password,
  });
};

module.exports = {
  loginWithPassword,
};