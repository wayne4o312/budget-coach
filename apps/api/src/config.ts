import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// Load repo-root .env (../../.. from apps/api/src/config.ts)
dotenv.config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

