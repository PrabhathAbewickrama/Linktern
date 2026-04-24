import { useEffect, useRef, useState } from "react";
import "./CareerChatbot.css";

const API_BASE_URL = import.meta.env.VITE_CHATBOT_API_URL || "http://localhost:5000";
const RETRYABLE_STATUS_CODES = new Set([502, 504]);
const QUICK_PROMPTS = [
  "What skills are most important for a frontend internship?",
  "How can I prepare for behavioral interviews?",
  "Show me a 30-day plan to become job-ready.",
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function CareerChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "Bot",
      text: "Hi! I am your Career Advisor Bot. Ask me about internships, interviews, and job market trends.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messageContainerRef = useRef(null);

  useEffect(() => {
    const container = messageContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (event) => {
    event.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || loading) {
      return;
    }

    setError("");
    setMessages((prev) => [...prev, { sender: "User", text: trimmedInput }]);
    setInput("");
    setLoading(true);

    try {
      let lastError = null;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: "linktern-student-demo",
            message: trimmedInput,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          setMessages((prev) => [...prev, { sender: "Bot", text: data.reply }]);
          lastError = null;
          break;
        }

        lastError = new Error(
          data.error || "Could not get a response from the chatbot server"
        );

        if (attempt === 0 && RETRYABLE_STATUS_CODES.has(response.status)) {
          await wait(1200);
          continue;
        }

        throw lastError;
      }

      if (lastError) {
        throw lastError;
      }
    } catch (err) {
      const errorMessage =
        err.message || "Something went wrong. Please retry shortly.";
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          sender: "Bot",
          text: "I ran into an issue. Please try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    if (!loading) {
      setInput(prompt);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`chat-launcher ${isOpen ? "hidden" : ""}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open chatbot"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 3C6.48 3 2 6.94 2 11.8c0 2.58 1.27 4.9 3.29 6.5L4.3 22l3.86-2.13c1.16.34 2.41.53 3.74.53 5.52 0 10-3.94 10-8.8S17.52 3 12 3zm-4.4 7.9a1.1 1.1 0 110-2.2 1.1 1.1 0 010 2.2zm4.4 0a1.1 1.1 0 110-2.2 1.1 1.1 0 010 2.2zm4.4 0a1.1 1.1 0 110-2.2 1.1 1.1 0 010 2.2z" />
        </svg>
      </button>

      <section
        className={`chat-widget ${isOpen ? "open" : ""}`}
        aria-label="Career advisor chatbot"
        aria-hidden={!isOpen}
      >
        <div className="chatbot-card">
          <header className="chatbot-header">
            <div className="bot-badge" aria-hidden="true">
              CA
            </div>
            <div className="header-content">
              <h1>Career Advisor Chatbot</h1>
              <p className="header-subtitle">
                Ask about internships, interview prep, resume strategy, and hiring trends.
              </p>
            </div>
            <button
              type="button"
              className="header-icon-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Minimize chatbot"
            >
              -
            </button>
          </header>

          <div className="quick-prompts" aria-label="Suggested prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="prompt-chip"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="message-window" ref={messageContainerRef}>
            <div className="timeline-label">Today</div>
            {messages.map((msg, index) => (
              <div
                key={`${msg.sender}-${index}`}
                className={`message-row ${msg.sender}`}
              >
                <div className="message-bubble-wrap">
                  <p className="sender-label">{msg.sender}</p>
                  <div className="message-bubble">{msg.text}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message-row Bot">
                <div className="message-bubble-wrap">
                  <p className="sender-label">Bot</p>
                  <div className="message-bubble thinking" aria-live="polite">
                    <span className="spinner" />
                    Bot is thinking...
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && <p className="error-text">{error}</p>}

          <form className="input-row" onSubmit={sendMessage}>
            <label htmlFor="chat-input" className="sr-only">
              Type your message
            </label>
            <input
              id="chat-input"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about internships, interview prep, or hiring trends..."
              maxLength={500}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

export default CareerChatbot;
