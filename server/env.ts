// Loads .env into process.env for local/non-Replit hosts. Must be imported before any other
// server module — hosting platforms that inject env vars directly (production) are unaffected,
// since dotenv never overrides a variable that's already set.
import dotenv from "dotenv";

dotenv.config();
