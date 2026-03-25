import express from "express";
import ChatHistory from "../models/ChatHistory.js";

const router = express.Router();

const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 15000;

const SYSTEM_PROMPT = `You are a university career coach chatbot.
Your responsibilities:
1) Give practical internship advice.
2) Give interview preparation tips.
3) Share current job market insights across software/tech roles.
4) Keep answers actionable, concise, and student-friendly.
5) If asked unrelated or unsafe questions, gently steer back to career guidance.`;

const buildOpenRouterBody = (userMessage) => ({
  model: OPENROUTER_MODEL,
  messages: [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: userMessage,
    },
  ],
  temperature: 0.7,
});

const parseOpenRouterText = (data) =>
  data?.choices?.[0]?.message?.content?.trim();

router.post("/", async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || typeof userId !== "string" || !userId.trim()) {
    return res.status(400).json({ error: "userId is required" });
  }

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message cannot be empty" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "OPENROUTER_API_KEY is not configured in environment variables",
    });
  }

  const cleanedMessage = message.trim();

  try {
    await ChatHistory.create({
      userId: userId.trim(),
      message: cleanedMessage,
      sender: "User",
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let openRouterResponse;
    try {
      openRouterResponse = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildOpenRouterBody(cleanedMessage)),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!openRouterResponse.ok) {
      const errorPayload = await openRouterResponse.json().catch(() => ({}));
      const apiErrorMessage =
        errorPayload?.error?.message || "OpenRouter API error";

      if (
        openRouterResponse.status === 401 ||
        openRouterResponse.status === 403
      ) {
        return res.status(401).json({
          error: "Invalid or unauthorized OpenRouter API key",
          details: apiErrorMessage,
        });
      }

      if (openRouterResponse.status === 429) {
        return res.status(429).json({
          error: "OpenRouter rate limit reached. Please try again later.",
          details: apiErrorMessage,
        });
      }

      return res.status(502).json({
        error: "Failed to get a response from OpenRouter",
        details: apiErrorMessage,
      });
    }

    const data = await openRouterResponse.json();
    const botReply = parseOpenRouterText(data);

    if (!botReply) {
      return res.status(502).json({
        error: "OpenRouter returned an empty response",
      });
    }

    await ChatHistory.create({
      userId: userId.trim(),
      message: botReply,
      sender: "Bot",
    });

    return res.status(200).json({ reply: botReply });
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(504).json({
        error: "OpenRouter API request timed out. Please try again.",
      });
    }

    console.error("POST /api/chat failed:", error);
    return res.status(500).json({
      error: "Internal server error while processing chat",
    });
  }
});

export default router;
