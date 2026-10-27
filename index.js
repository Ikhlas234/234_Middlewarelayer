import "dotenv/config";
import express from "express";
import PG from "pg";
import joi from "joi";

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

// Joi validation schema
const biodataSchema = joi.object({
    id: joi.number().integer().required(),
    nama: joi.string().trim().min(2).max(100).required(),
    nim: joi.string().trim().min(10).max(20).required(),
    kelas: joi.string().trim().min(1).max(20).required(),
});

const idSchema = joi.object({
    id: joi.number().integer().positive().required(),
});

// Middleware untuk validasi body
function validateBody(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            convert: true,
            allowUnknown: false
        });
        if (error) {
            return errorResponse(
                res,
                'validasi input gagal',
                400,
                error.details.map(item => ({
                    field: item.path.join('.'),
                    message: item.message
                }))
            );
        }
        req.body = value;
        next();
    };
}

// Middleware untuk validasi parameter ID
function validateParams(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            convert: true
        });
        if (error) {
            return errorResponse(
                res,
                'Parameter tidak valid',
                400,
                error.details.map(item => ({
                    field: item.path.join('.'),
                    message: item.message
                }))
            );
        }
        req.params = value;
        next();
    };
}

app.get('/', async (req, res) => {
    const result = await poll.query('SELECT * FROM biodata ORDER BY id');
    return successResponse(res, 'Data berhasil diambil', result.rows);
});

app.post('/biodata', validateBody(biodataSchema), async (req, res) => {
    const { id, nama, nim, kelas } = req.body;
    const result = await poll.query(
        'INSERT INTO biodata (id, nama, nim, kelas) VALUES ($1, $2, $3, $4) RETURNING *',
        [id ?? null, nama, nim, kelas]
    );
    return successResponse(res, 'Data berhasil ditambahkan', result.rows[0], 201);
});

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});
