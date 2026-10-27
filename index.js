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

// Auto-create table biodata jika belum ada
const initDb = async () => {
    try {
        await poll.query(`
            CREATE TABLE IF NOT EXISTS biodata (
                id SERIAL PRIMARY KEY,
                nama VARCHAR(100) NOT NULL,
                nim VARCHAR(20) NOT NULL,
                kelas VARCHAR(20) NOT NULL
            );
        `);
    } catch (err) {
        console.error("Gagal inisialisasi tabel biodata:", err.message);
    }
};
initDb();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});
