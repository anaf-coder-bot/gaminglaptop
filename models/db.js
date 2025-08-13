import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString:process.env.DATABASE_URL
})

async function initDB() {
    const createUserTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(25) PRIMARY KEY NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL
    );
    `;
    try {
        await pool.query(createUserTableQuery);
        console.log("User table created ✅")
    } catch(err) {
        console.error("Error while creating user table " + err);
    }

    try {
        await pool.query(`
            INSERT INTO users (username, password, email)
            VALUES (
                '${process.env.DEFAULT_USERNAME}',
                '${process.env.DEFAULT_PASSWORD}',
                '${process.env.DEFAULT_EMAIL}'
            )
            ON CONFLICT (username) DO NOTHING;
            `);
        console.log("User added to user table ✅");
    } catch(err) {
        console.error("Error while adding user to user table " + err);
    };

    const createLaptopTableQuery = `
    CREATE TABLE IF NOT EXISTS laptops (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(50) NOT NULL,
        model VARCHAR(50) NOT NULL,
        processor VARCHAR(50) NOT NULL,
        graphics VARCHAR(50) NOT NULL,
        ram VARCHAR(50) NOT NULL,
        storage VARCHAR(50) NOT NULL,
        display VARCHAR(50) NOT NULL,
        screen_width VARCHAR(50) NOT NULL,
        catagory VARCHAR(20) NOT NULL,
        state VARCHAR(20) NOT NULL,
        in_stock NUMERIC NOT NULL,
        description TEXT,
        price NUMERIC NOT NULL,
        last_modified DATE DEFAULT CURRENT_DATE,
        img_1 TEXT NOT NULL,
        img_2 TEXT,
        img_3 TEXT,
        img_4 TEXT,
        img_5 TEXT,
        img_6 TEXT
    )
    `;

    try {
        await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        await pool.query(createLaptopTableQuery);
        console.log("Laptop table created ✅");
    } catch(err) {
        console.error("Error while creating laptop tabel " + err);
    };
};

export {initDB, pool};