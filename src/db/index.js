const dotenv = require("dotenv");
dotenv.config();

const supabase = require("@supabase/supabase-js");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = db;