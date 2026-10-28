require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Student = require("./models/Student");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET all
app.get("/api/students", async (req, res, next) => {
  try {
    res.json(await Student.find());
  } catch (err) { next(err); }
});

// GET one
app.get("/api/students/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid student ID" });
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) { next(err); }
});

// POST create
app.post("/api/students", async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) { next(err); }
});

// PUT update
app.put("/api/students/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid student ID" });
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) { next(err); }
});

// DELETE
app.delete("/api/students/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid student ID" });
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json({ message: "Student deleted successfully", student });
  } catch (err) { next(err); }
});

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Central error handler (no stack traces sent to clients)
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: "Validation failed", details: messages });
  }
  if (err.name === "CastError" || err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid input" });
  }
  console.error(err); // logged on the server only
  res.status(500).json({ error: "Internal server error" });
});

// Connect to DB first, then start listening
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });