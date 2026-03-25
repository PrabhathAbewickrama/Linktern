import { useEffect, useRef, useState } from "react";
import "./Chatbot.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const Chatbot = () => {
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
    const messageContainer = messageContainerRef.current;
    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (event) => {
    event.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || loading) {
      return;
    }

    setError("");

    const userMessage = { sender: "User", text: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "student-demo-user",
          message: trimmedInput,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || "Could not get a response from the server"
        );
      }

      setMessages((prev) => [...prev, { sender: "Bot", text: data.reply }]);
    } catch (err) {
      const errorMessage = err.message || "Something went wrong. Please retry.";
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

  return (
    <div className="chatbot-page">
      <div className="chatbot-card">
        <h1>Career Advisor Chatbot</h1>
        <div className="message-window" ref={messageContainerRef}>
          {messages.map((msg, index) => (
            <div
              key={`${msg.sender}-${index}`}
              className={`message-row ${msg.sender}`}
            >
              <div className="message-bubble">{msg.text}</div>
            </div>
          ))}

          {loading && (
            <div className="message-row Bot">
              <div className="message-bubble thinking">
                <span className="spinner" />
                Bot is thinking...
              </div>
            </div>
          )}
        </div>

        {error && <p className="error-text">{error}</p>}

        <form className="input-row" onSubmit={sendMessage}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about internships, interview prep, or hiring trends..."
            maxLength={500}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
