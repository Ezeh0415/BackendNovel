const express = require("express");
const { connectDB } = require("./models/db");
const cors = require("cors");
const bookRoutes = require("./routes/bookRoutes");

// init and middleware
const app = express();
app.use(express.json());

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

app.use(
  cors({
    origin: "*", // Replace with your frontend URL for security in production
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
