const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Response", responseSchema);