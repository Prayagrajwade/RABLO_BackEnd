import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import productRoutes from "./routes/products.js";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN, // Use the specific frontend origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Only set to true if you need to send cookies or auth headers
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/products", productRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to product page");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  connectDB();
  console.log(`Server is listening at http://localhost:${PORT}`);
});