import { useState } from "react";

function CommentInput({ onSubmit, disabled = false }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedText = text.trim();

    if (!trimmedText) {
      setError("Please write a comment first.");
      return;
    }

    try {
      setError("");
      await onSubmit(trimmedText);
      setText("");
    } catch (err) {
      setError(err.message || "Failed to add comment");
    }
  };

  return (
    <form className="comment-input-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Write a comment..."
        disabled={disabled}
      />
      <button type="submit" className="feed-secondary-btn" disabled={disabled}>
        {disabled ? "Adding..." : "Comment"}
      </button>
      {error && <p className="feed-inline-error full-width">{error}</p>}
    </form>
  );
}

export default CommentInput;
