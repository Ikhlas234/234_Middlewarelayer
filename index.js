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

// Middleware Logging
app.use((req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log({
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });
    });
    next();
});

// Response Envelope
function responseEnvelope(res, data, message, status = 200) {
    return res.status(status).json({
        success: true, message, data, error: null,
    })
}

function errorResponseEnvelope(res, status, message, details = null) {
    return res.status(status).json({
        success: false, message, data: null, error: details,
    })
}

function successResponse(res, message, data = null, status = 200) {
    return responseEnvelope(res, data, message, status)
}

function errorResponse(res, message, statusOrDetails = 400, details = null) {
    let status = 400
    let errorDetails = details
    if (typeof statusOrDetails === 'number') {
        status = statusOrDetails
    } else if (statusOrDetails !== null && typeof statusOrDetails !== 'undefined') {
        errorDetails = statusOrDetails
        status = 400
    }
    return errorResponseEnvelope(res, status, message, errorDetails)
}

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});
