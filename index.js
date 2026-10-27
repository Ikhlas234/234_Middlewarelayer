import "dotenv/config";
import express from "express";
import PG from "pg";

const app = express();
const port = process.env.PORT || 3000;
const { Pool } = PG;

const poll = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS || process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432
});

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});
