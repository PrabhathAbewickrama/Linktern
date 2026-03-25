import express from "express";
import mongoose from "mongoose";
import ChatHistory from "../models/ChatHistory.js";

const router = express.Router();

const PRIMARY_OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "google/gemma-3n-e4b-it:free";
const OPENROUTER_FALLBACK_MODELS = (
  process.env.OPENROUTER_FALLBACK_MODELS ||
  "google/gemma-3n-e2b-it:free,liquid/lfm-2.5-1.2b-instruct:free"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS || 30000);
const MODEL_REQUEST_TIMEOUT_MS = Number(
  process.env.OPENROUTER_MODEL_TIMEOUT_MS || 12000
);
const MODEL_REQUEST_RETRIES = Number(process.env.OPENROUTER_MODEL_RETRIES || 0);
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL;
const OPENROUTER_SITE_NAME = process.env.OPENROUTER_SITE_NAME || "Linktern";

const SYSTEM_PROMPT = `You are a university career coach chatbot.
Your responsibilities:
1) Give practical internship advice.
2) Give interview preparation tips.
3) Share current job market insights across software/tech roles.
4) Keep answers actionable, concise, and student-friendly.
5) If asked unrelated or unsafe questions, gently steer back to career guidance.`;

const buildOpenRouterBody = (userMessage, model) => ({
  model,
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
  max_tokens: 280,
});

const parseOpenRouterText = (data) =>
  data?.choices?.[0]?.message?.content?.trim();

const fetchWithTimeout = async ({ url, options, timeoutMs }) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const getCandidateModels = () => {
  const models = [PRIMARY_OPENROUTER_MODEL, ...OPENROUTER_FALLBACK_MODELS];
  return [...new Set(models)];
};

const persistMessage = async ({ userId, message, sender }) => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  try {
    await ChatHistory.create({ userId, message, sender });
  } catch (error) {
    console.warn("Chat history persistence skipped:", error.message);
  }
};

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
  const cleanedUserId = userId.trim();

  try {
    await persistMessage({
      userId: cleanedUserId,
      message: cleanedMessage,
      sender: "User",
    });

    const startedAt = Date.now();

    const requestHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Title": OPENROUTER_SITE_NAME,
    };

    if (OPENROUTER_SITE_URL) {
      requestHeaders["HTTP-Referer"] = OPENROUTER_SITE_URL;
    }

    const attemptedModels = [];
    let botReply = "";
    let lastOpenRouterError = null;

    for (const model of getCandidateModels()) {
      for (let attempt = 0; attempt <= MODEL_REQUEST_RETRIES; attempt += 1) {
        const elapsedMs = Date.now() - startedAt;
        const remainingMs = REQUEST_TIMEOUT_MS - elapsedMs;
        if (remainingMs <= 0) {
          return res.status(504).json({
            error: "OpenRouter API request timed out. Please try again.",
            modelTried: attemptedModels,
          });
        }

        attemptedModels.push(model);

        let openRouterResponse;
        try {
          openRouterResponse = await fetchWithTimeout({
            url: OPENROUTER_API_URL,
            options: {
              method: "POST",
              headers: requestHeaders,
              body: JSON.stringify(buildOpenRouterBody(cleanedMessage, model)),
            },
            timeoutMs: Math.min(MODEL_REQUEST_TIMEOUT_MS, remainingMs),
          });
        } catch (requestError) {
          if (requestError.name === "AbortError") {
            lastOpenRouterError = {
              status: 504,
              message: `Model request timed out (${model})`,
              model,
            };

            if (attempt < MODEL_REQUEST_RETRIES) {
              continue;
            }

            break;
          }

          lastOpenRouterError = {
            status: 502,
            message: requestError.message || "Network error calling OpenRouter",
            model,
          };

          if (attempt < MODEL_REQUEST_RETRIES) {
            continue;
          }

          break;
        }

        if (!openRouterResponse.ok) {
          const errorPayload = await openRouterResponse
            .json()
            .catch(() => ({}));
          const apiErrorMessage =
            errorPayload?.error?.message || "OpenRouter API error";

          lastOpenRouterError = {
            status: openRouterResponse.status,
            message: apiErrorMessage,
            model,
          };

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
            if (attempt < MODEL_REQUEST_RETRIES) {
              continue;
            }
            continue;
          }

          if (
            openRouterResponse.status === 400 ||
            openRouterResponse.status === 404
          ) {
            continue;
          }

          if (attempt < MODEL_REQUEST_RETRIES) {
            continue;
          }

          continue;
        }

        const data = await openRouterResponse.json();
        botReply = parseOpenRouterText(data);
        if (botReply) {
          break;
        }

        lastOpenRouterError = {
          status: 502,
          message: "OpenRouter returned an empty response",
          model,
        };

        if (attempt < MODEL_REQUEST_RETRIES) {
          continue;
        }
      }

      if (botReply) {
        break;
      }
    }

    if (!botReply) {
      return res.status(502).json({
        error: "Failed to get a response from OpenRouter",
        details: lastOpenRouterError?.message || "OpenRouter returned no text",
        modelTried: attemptedModels,
      });
    }

    await persistMessage({
      userId: cleanedUserId,
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
