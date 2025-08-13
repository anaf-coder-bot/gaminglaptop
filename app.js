import express from "express";
import dotenv from "dotenv";
dotenv.config();
import path from "path";
import { fileURLToPath } from "url";
import { initDB } from "./models/db.js";
import favicon from "serve-favicon";

import webRouter from "./routes/webRoutes.js";
import loginRouter from "./routes/loginRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import flash from "connect-flash";
import session from "express-session";

import nodemailer from "nodemailer";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    }
});

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET // keep this in .env
});

// 2. Create Cloudinary Storage adapter
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "laptops_img", // Cloudinary folder name
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }] // optional resize
  }
});

// 3. Create multer upload handler
const upload = multer({ storage });



const app = express();
const PORT = process.env.PORT || 3000;

app.use(
    session({
        secret: process.env.SECREAT_SESSION_KEY,
        resave: false,
        saveUninitialized: true,
    })
)
app.use(flash());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(favicon(path.join(__dirname, 'public', 'favicon', 'logo.ico')));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

app.use('/', webRouter);
app.use('/login', loginRouter);
app.use('/admin', adminRouter(upload));

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initDB();
});

export {transporter};