import { useMemo, useState } from "react";
import { ImagePlus, SendHorizontal, UserCircle2, X } from "lucide-react";
import postService from "../../services/postService";

const getDisplayName = (user) => {
  if (!user) return "there";

  if (user.role === "company") {
    return user.companyName || user.name || user.username || "Company";
  }

  return user.name || user.username || "Student";
};

const getProfileCaption = (user) => {
  if (!user) return "Posting to the community";

  if (user.role === "company") {
    return user.email || "Company account";
  }

  return user.email || "Student account";
};

const getImageUrl = (path) => {
  if (!path) return "";
  return path.startsWith("http") ? path : `http://localhost:5000${path}`;
};

function CreatePostBox({ currentUser, onPostCreated }) {
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const displayName = useMemo(() => getDisplayName(currentUser), [currentUser]);
  const profileCaption = useMemo(
    () => getProfileCaption(currentUser),
    [currentUser],
  );
  const avatarSrc = useMemo(
    () => getImageUrl(currentUser?.profilePicture),
    [currentUser],
  );

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5MB or less.");
      return;
    }

    setError("");
    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewImage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent && !selectedImage) {
      setError("Please write something or attach an image before posting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const formData = new FormData();
      formData.append("content", trimmedContent);
      formData.append("isAnonymous", String(isAnonymous));

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const post = await postService.createPost(formData);

      setContent("");
      setIsAnonymous(false);
      setSelectedImage(null);
      setPreviewImage("");
      onPostCreated?.(post);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="feed-panel create-post-box">
      <div className="create-post-header">
        {avatarSrc ? (
          <img src={avatarSrc} alt={displayName} className="feed-avatar" />
        ) : (
          <div className="feed-avatar-fallback large-avatar">
            <UserCircle2 size={24} />
          </div>
        )}

        <div className="create-post-identity">
          <div className="create-post-identity-top">
            <h2>{displayName}</h2>
            <span className="create-post-role-pill">
              {currentUser?.role === "company" ? "Company" : "Student"}
            </span>
          </div>
          <p>{profileCaption}</p>
          <span className="create-post-helper">
            Post to the LINKTERN community
          </span>
        </div>
      </div>

      {error && <p className="feed-inline-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Share your thoughts, opportunities, or advice..."
          rows="4"
          maxLength={2000}
          className="create-post-textarea"
        />

        <div className="create-post-tools">
          <label className="image-upload-btn">
            <ImagePlus size={16} />
            <span>{selectedImage ? "Change image" : "Add image"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />
          </label>

          {selectedImage && (
            <button
              type="button"
              className="remove-image-btn"
              onClick={handleRemoveImage}
            >
              <X size={16} />
              Remove image
            </button>
          )}
        </div>

        {previewImage && (
          <div className="image-preview-box">
            <img
              src={previewImage}
              alt="Selected preview"
              className="image-preview"
            />
            <p>{selectedImage?.name}</p>
          </div>
        )}

        <div className="create-post-footer">
          <label className="anonymous-toggle">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) => setIsAnonymous(event.target.checked)}
            />
            <span>Post anonymously</span>
          </label>

          <button
            type="submit"
            className="feed-primary-btn"
            disabled={submitting}
          >
            <SendHorizontal size={16} />
            {submitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default CreatePostBox;
