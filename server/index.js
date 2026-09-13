const express = require("express");
const cors = require("cors");
require("dotenv").config();

const analyzeRoute = require("./routes/analyze");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/analyze", analyzeRoute);

app.get("/", (req, res) => {
  res.json({
    message: "ProjectPulse API is running 🚀",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ProjectPulse",
  });
});

app.listen(PORT, () => {
  console.log(`ProjectPulse API running on http://localhost:${PORT}`);
});