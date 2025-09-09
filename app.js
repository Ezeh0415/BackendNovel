require("dotenv").config();
const express = require("express");
const { connectDB } = require("./models/db");
const cors = require("cors");
const bookRoutes = require("./routes/bookRoutes");

// init and middleware
const app = express();
app.use(express.json({ limit: '10mb' })); // or even '10mb' if needed
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// dbConnection
connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`listening to port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
  });

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:5500",
  "https://front-end-novel-oi5s.vercel.app",
  "https://front-end-novel.vercel.app",
  "https://backendnovel-production.up.railway.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin like mobile apps or curl
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Register routes
app.use(bookRoutes);

// Custom middleware to handle OPTIONS preflight requests manually
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.sendStatus(204);
  }
  next();
});
