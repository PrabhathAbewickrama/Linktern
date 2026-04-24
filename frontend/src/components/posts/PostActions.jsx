import { Heart, MessageCircle, Share2 } from "lucide-react";

function PostActions({
  post,
  liking,
  sharing,
  commentsOpen,
  onLike,
  onToggleComments,
  onShare,
}) {
  return (
    <div className="post-actions-row">
      <button
        type="button"
        className={`post-action-btn ${post.isLikedByCurrentUser ? "liked" : ""}`}
        onClick={onLike}
        disabled={liking}
      >
        <Heart size={16} />
        <span>{post.isLikedByCurrentUser ? "Liked" : "Like"}</span>
        <strong>{post.likeCount || 0}</strong>
      </button>

      <button
        type="button"
        className={`post-action-btn ${commentsOpen ? "active" : ""}`}
        onClick={onToggleComments}
      >
        <MessageCircle size={16} />
        <span>Comment</span>
        <strong>{post.commentCount || 0}</strong>
      </button>

      <button
        type="button"
        className="post-action-btn"
        onClick={onShare}
        disabled={sharing}
      >
        <Share2 size={16} />
        <span>{sharing ? "Sharing..." : "Reshare"}</span>
        <strong>{post.shareCount || 0}</strong>
      </button>
    </div>
  );
}

export default PostActions;
