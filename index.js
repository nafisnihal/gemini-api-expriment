const express = require("express");
const mongoose = require("mongoose");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Response = require("./models/Response");
const path = require("path");

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Response Generator API",
      version: "1.0.0",
      description: "API for generating and storing responses based on prompts",
    },
    servers: [
      {
        // url: `http://localhost:${port}`, // Change to your deployed URL when available
        url: `https://gemini-api-expriment.vercel.app`,
      },
    ],
  },
  apis: ["index.js"], // Path to the API docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const key = process.env.SECRET_KEY;
const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Could not connect to MongoDB", error));

// API to generate and store response based on prompt from payload
/**
 * @swagger
 * /api/generate:
 *   post:
 *     summary: Generate and store a response
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *     responses:
 *       201:
 *         description: Response generated and stored successfully
 *       400:
 *         description: Prompt is required
 *       500:
 *         description: Error generating content
 */
app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const newResponse = new Response({ prompt: prompt, content: responseText });
    await newResponse.save();

    res
      .status(201)
      .json({ message: "Response generated and stored", data: newResponse });
  } catch (error) {
    res.status(500).json({ error: "Error generating content" });
  }
});

/**
 * @swagger
 * /api/responses:
 *   get:
 *     summary: Retrieve all stored responses
 *     responses:
 *       200:
 *         description: Successfully retrieved responses
 *       500:
 *         description: Error fetching responses
 */
app.get("/api/responses", async (req, res) => {
  try {
    const responses = await Response.find();
    res.status(200).json({ data: responses });
  } catch (error) {
    res.status(500).json({ error: "Error fetching responses" });
  }
});

/**
 * @swagger
 * /api/responses/{id}:
 *   get:
 *     summary: Retrieve a specific response by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the response to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved the response
 *       404:
 *         description: Response not found
 *       500:
 *         description: Error fetching response
 */
app.get("/api/responses/:id", async (req, res) => {
  try {
    const response = await Response.findById(req.params.id);
    if (!response) return res.status(404).json({ error: "Response not found" });
    res.status(200).json({ data: response });
  } catch (error) {
    res.status(500).json({ error: "Error fetching response" });
  }
});

/**
 * @swagger
 * /api/responses/{id}:
 *   put:
 *     summary: Update a specific response by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the response to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Response updated successfully
 *       404:
 *         description: Response not found
 *       500:
 *         description: Error updating response
 */
app.put("/api/responses/:id", async (req, res) => {
  const { prompt, content } = req.body;
  try {
    const updatedResponse = await Response.findByIdAndUpdate(
      req.params.id,
      { prompt, content },
      { new: true, runValidators: true }
    );

    if (!updatedResponse)
      return res.status(404).json({ error: "Response not found" });
    res.status(200).json({
      message: "Response updated successfully",
      data: updatedResponse,
    });
  } catch (error) {
    res.status(500).json({ error: "Error updating response" });
  }
});

/**
 * @swagger
 * /api/responses/{id}:
 *   delete:
 *     summary: Delete a specific response by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the response to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Response deleted successfully
 *       404:
 *         description: Response not found
 *       500:
 *         description: Error deleting response
 */
app.delete("/api/responses/:id", async (req, res) => {
  try {
    const deletedResponse = await Response.findByIdAndDelete(req.params.id);
    if (!deletedResponse)
      return res.status(404).json({ error: "Response not found" });
    res.status(200).json({ message: "Response deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting response" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
