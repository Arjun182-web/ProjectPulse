const express = require("express");
const { analyzeCommunication } = require("../services/analyzer");
const {
  saveProjectMemory,
  getProjectMemory,
} = require("../services/memory");

const router = express.Router();

router.post("/",async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Communication message is required.",
      });
    }

    const result =await analyzeCommunication(message);
    const savedResult = saveProjectMemory(result);


    res.json({
  success: true,
  data: savedResult,
});
  } catch (error) {
    console.error("Analysis error:", error);

    res.status(500).json({
      error: "Failed to analyze communication.",
    });
  }
});

router.get("/memory", (req, res) => {
  try {
    const memory = getProjectMemory();

    res.json({
      success: true,
      data: memory,
    });
  } catch (error) {
    console.error("Memory error:", error);

    res.status(500).json({
      error: "Failed to load project memory.",
    });
  }
});

module.exports = router;