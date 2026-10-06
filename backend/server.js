const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* =========================
   AUTH ROUTES
========================= */

app.use("/api/auth", authRoutes);


/* =========================
   ROOT ROUTE
========================= */

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "JobNest Backend is running!",
        version: "1.0.0"
    });
});


/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
    console.log(`JobNest Backend running on port ${PORT}`);
});