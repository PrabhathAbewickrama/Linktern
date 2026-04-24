import { UserCircle2 } from "lucide-react";

const getImageUrl = (path) => {
  if (!path) return "";
  return path.startsWith("http") ? path : `http://localhost:5000${path}`;
};

function CommentList({ comments = [] }) {
  if (!comments.length) {
    return (
      <div className="comment-empty">
        No comments yet. Start the conversation.
      </div>
    );
  }

  return (
    <div className="comment-list">
      {comments.map((comment) => {
        const avatarSrc = getImageUrl(comment.userProfilePicture);

        return (
          <div key={comment._id} className="comment-item">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={comment.userDisplayName}
                className="comment-avatar"
              />
            ) : (
              <div className="comment-avatar fallback">
                <UserCircle2 size={18} />
              </div>
            )}

            <div className="comment-content">
              <div className="comment-meta">
                <strong>{comment.userDisplayName}</strong>
                <span>{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p>{comment.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CommentList;
