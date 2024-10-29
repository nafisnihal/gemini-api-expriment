const express = require("express");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 3000;

const key = process.env.SECRET_KEY;
const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const apiResponse = async () => {
  const prompt = "Tell me a story about a dragon and a knight.";
  const result = await model.generateContent(prompt);
  return result.response.text();
};

app.get("/", async (req, res) => {
  try {
    const responseText = await apiResponse();
    res.send(`Generated Response: ${responseText}`);
  } catch (error) {
    res.status(500).send("Error generating content.");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
