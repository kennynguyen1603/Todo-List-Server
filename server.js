import express from "express";
import mongoose from "mongoose";
import rootRouterV1 from "./api/routers/index.js";
import dotenv from "dotenv";
import session from "express-session";
import cors from "cors";
dotenv.config();

await mongoose.connect(process.env.DATABASE_URL);

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mySessionSecret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: true },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1", rootRouterV1);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
