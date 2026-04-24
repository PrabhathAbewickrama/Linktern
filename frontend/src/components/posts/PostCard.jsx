import { useEffect, useState } from "react";
import {
  Clock3,
  Edit3,
  ImagePlus,
  Repeat2,
  Save,
  Trash2,
  UserCircle2,
  X,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import postService from "../../services/postService";
import CommentInput from "./CommentInput";
import CommentList from "./CommentList";
import PostActions from "./PostActions";

const getImageUrl = (path) => {
  if (!path) return "";
  return path.startsWith("http") ? path : `http://localhost:5000${path}`;
};

const postImageFrameStyle = {
  width: "100%",
  maxWidth: "100%",
  height: "220px",
  overflow: "hidden",
  borderRadius: "14px",
  background: "#e2e8f0",
  border: "1px solid rgba(148, 163, 184, 0.24)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const postImageStyle = {
  width: "100%",
  height: "100%",
  maxWidth: "100%",
  objectFit: "cover",
  objectPosition: "center",
  display: "block",
};

function PostCard({ post, onPostUpdated, onPostCreated, onPostDeleted }) {
  const [currentPost, setCurrentPost] = useState(post);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [liking, setLiking] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(post.content || "");
  const [draftImage, setDraftImage] = useState(null);
  const [draftPreview, setDraftPreview] = useState("");
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setCurrentPost(post);
    setDraftContent(post.content || "");
    setDraftImage(null);
    setDraftPreview("");
    setRemoveExistingImage(false);
    setEditing(false);
  }, [post]);

  const syncUpdatedPost = (updatedPost) => {
    if (!updatedPost) return;
    setCurrentPost(updatedPost);
    onPostUpdated?.(updatedPost);
  };

  const renderAuthorName = (authorId, displayName) => {
    if (!authorId) {
      return <span>{displayName}</span>;
    }

    return (
      <Link to={`/profile/${authorId}`} className="post-author-link">
        {displayName}
      </Link>
    );
  };

  const handleLike = async () => {
    try {
      setLiking(true);
      setError("");
      setFeedback("");
      const updatedPost = await postService.toggleLike(currentPost._id);
      syncUpdatedPost(updatedPost);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update like");
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      setSharing(true);
      setError("");
      setFeedback("");

      const result = await postService.sharePost(currentPost._id);

      if (result?.sourcePost?._id === currentPost._id) {
        syncUpdatedPost(result.sourcePost);
      } else if (
        result?.sourcePost &&
        currentPost.sharedPost?._id === result.sourcePost._id
      ) {
        const mergedPost = {
          ...currentPost,
          sharedPost: result.sourcePost,
        };
        setCurrentPost(mergedPost);
        onPostUpdated?.(mergedPost);
      }

      if (result?.sharedPost) {
        onPostCreated?.(result.sharedPost);
      }

      if (navigator?.clipboard && window?.location) {
        await navigator.clipboard.writeText(
          `${window.location.origin}/feed#post-${currentPost._id}`,
        );
        setFeedback(
          `${result?.message || "Post shared successfully."} Link copied.`,
        );
      } else {
        setFeedback(result?.message || "Post shared successfully.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to share post");
    } finally {
      setSharing(false);
    }
  };

  const handleAddComment = async (text) => {
    try {
      setCommenting(true);
      setError("");
      const updatedPost = await postService.addComment(currentPost._id, text);
      syncUpdatedPost(updatedPost);
      setCommentsOpen(true);
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to add comment");
    } finally {
      setCommenting(false);
    }
  };

  const handleEditImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5MB or less.");
      return;
    }

    setError("");
    setDraftImage(file);
    setDraftPreview(URL.createObjectURL(file));
    setRemoveExistingImage(false);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setDraftContent(currentPost.content || "");
    setDraftImage(null);
    setDraftPreview("");
    setRemoveExistingImage(false);
    setError("");
  };

  const handleSaveEdit = async () => {
    try {
      setSavingEdit(true);
      setError("");
      setFeedback("");

      const formData = new FormData();
      formData.append("content", draftContent.trim());
      formData.append("removeImage", String(removeExistingImage));

      if (draftImage) {
        formData.append("image", draftImage);
      }

      const updatedPost = await postService.updatePost(
        currentPost._id,
        formData,
      );
      syncUpdatedPost(updatedPost);
      setEditing(false);
      setDraftImage(null);
      setDraftPreview("");
      setRemoveExistingImage(false);
      setFeedback("Post updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update post");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      const result = await postService.deletePost(currentPost._id);
      onPostDeleted?.(result.deletedPostId || currentPost._id);
      setFeedback(result.message || "Post deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  const authorAvatar = getImageUrl(currentPost.authorProfilePicture);
  const postImageSrc = getImageUrl(currentPost.image);
  const sharedPost = currentPost.sharedPost;
  const sharedAuthorAvatar = getImageUrl(sharedPost?.authorProfilePicture);
  const sharedPostImageSrc = getImageUrl(sharedPost?.image);
  const editPreviewSrc =
    draftPreview || (!removeExistingImage ? postImageSrc : "");
  const renderPostImage = (src, altText) => (
    <div className="post-media-frame" style={postImageFrameStyle}>
      <img
        src={src}
        alt={altText}
        className="post-image"
        style={postImageStyle}
        loading="lazy"
      />
    </div>
  );
  const roleLabel = currentPost.isAnonymous
    ? "Anonymous post"
    : currentPost.postType === "share"
      ? `${currentPost.authorRole === "company" ? "Company" : "Student"} · Shared`
      : currentPost.authorRole === "company"
        ? "Company"
        : "Student";

  return (
    <article id={`post-${currentPost._id}`} className="feed-panel post-card">
      {currentPost.postType === "share" && (
        <div className="shared-context-label">
          <Repeat2 size={14} />
          <span>{currentPost.authorDisplayName} reshared this post</span>
        </div>
      )}

      <div className="post-header with-owner-actions">
        <div className="post-author-block">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={currentPost.authorDisplayName}
              className="feed-avatar"
            />
          ) : (
            <div className="feed-avatar-fallback">
              <UserCircle2 size={22} />
            </div>
          )}

          <div>
            <h3>
              {renderAuthorName(
                currentPost.authorId,
                currentPost.authorDisplayName,
              )}
            </h3>
            <div className="post-subtitle-row">
              <span className="role-pill">{roleLabel}</span>
              <span className="time-stamp">
                <Clock3 size={13} />
                {new Date(currentPost.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {currentPost.canEdit && (
          <div className="post-owner-actions">
            <button
              type="button"
              className="owner-action-btn"
              onClick={() => setEditing((value) => !value)}
            >
              <Edit3 size={14} />
              {editing ? "Close" : "Edit"}
            </button>
            <button
              type="button"
              className="owner-action-btn danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 size={14} />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="post-edit-box">
          <textarea
            value={draftContent}
            onChange={(event) => setDraftContent(event.target.value)}
            className="create-post-textarea"
            rows="4"
            placeholder="Edit your post content..."
          />

          <div className="create-post-tools">
            <label className="image-upload-btn">
              <ImagePlus size={16} />
              <span>{draftImage ? "Change image" : "Update image"}</span>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleEditImageChange}
              />
            </label>

            {(postImageSrc || draftPreview) && (
              <button
                type="button"
                className="remove-image-btn"
                onClick={() => {
                  setRemoveExistingImage(true);
                  setDraftImage(null);
                  setDraftPreview("");
                }}
              >
                <X size={16} />
                Remove image
              </button>
            )}
          </div>

          {editPreviewSrc && (
            <div className="image-preview-box">
              <img
                src={editPreviewSrc}
                alt="Updated preview"
                className="image-preview"
              />
            </div>
          )}

          <div className="post-edit-actions">
            <button
              type="button"
              className="feed-primary-btn"
              onClick={handleSaveEdit}
              disabled={savingEdit}
            >
              <Save size={16} />
              {savingEdit ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              className="feed-secondary-btn cancel-inline-btn"
              onClick={handleCancelEdit}
              disabled={savingEdit}
            >
              <XCircle size={16} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {currentPost.content && (
            <p className="post-content">{currentPost.content}</p>
          )}

          {postImageSrc && renderPostImage(postImageSrc, "Post attachment")}
        </>
      )}

      {sharedPost && (
        <div className="shared-post-card">
          <div className="post-author-block">
            {sharedAuthorAvatar ? (
              <img
                src={sharedAuthorAvatar}
                alt={sharedPost.authorDisplayName}
                className="feed-avatar"
              />
            ) : (
              <div className="feed-avatar-fallback">
                <UserCircle2 size={22} />
              </div>
            )}

            <div>
              <h4>
                {renderAuthorName(
                  sharedPost.authorId,
                  sharedPost.authorDisplayName,
                )}
              </h4>
              <div className="post-subtitle-row">
                <span className="role-pill">
                  {sharedPost.isAnonymous
                    ? "Anonymous post"
                    : sharedPost.authorRole === "company"
                      ? "Company"
                      : "Student"}
                </span>
                <span className="time-stamp">
                  <Clock3 size={13} />
                  {new Date(sharedPost.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {sharedPost.content && (
            <p className="post-content nested-post-content">
              {sharedPost.content}
            </p>
          )}

          {sharedPostImageSrc && (
            <div className="nested-media-frame">
              {renderPostImage(sharedPostImageSrc, "Shared post attachment")}
            </div>
          )}
        </div>
      )}

      {error && <p className="feed-inline-error">{error}</p>}
      {feedback && <p className="feed-feedback-text">{feedback}</p>}

      <PostActions
        post={currentPost}
        liking={liking}
        sharing={sharing}
        commentsOpen={commentsOpen}
        onLike={handleLike}
        onToggleComments={() => setCommentsOpen((value) => !value)}
        onShare={handleShare}
      />

      {commentsOpen && (
        <div className="comment-section">
          <CommentList comments={currentPost.comments} />
          <CommentInput onSubmit={handleAddComment} disabled={commenting} />
        </div>
      )}
    </article>
  );
}

export default PostCard;
