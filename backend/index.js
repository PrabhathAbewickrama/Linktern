import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import chatRouter from "./routes/chatRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Career Advisor API is running" });
});

app.get("/api/health", (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: "ok",
    mongo: mongoReady ? "connected" : "disconnected",
  });
});

app.use("/api/chat", chatRouter);

const connectMongo = async () => {
  if (!MONGODB_URI) {
    console.warn(
      "MONGODB_URI is missing. Running without MongoDB persistence."
    );
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error(
      "MongoDB connection failed. API will continue without DB persistence:",
      error.message
    );
  }
};

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  await connectMongo();
};

startServer();
