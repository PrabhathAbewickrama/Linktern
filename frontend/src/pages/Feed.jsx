import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreatePostBox from "../components/posts/CreatePostBox";
import PostCard from "../components/posts/PostCard";
import postService from "../services/postService";
import { getStoredUser } from "../utils/session";
import "../components/posts/posts.css";

function Feed() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const allPosts = await postService.getFeedPosts();
      setPosts(Array.isArray(allPosts) ? allPosts : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load the feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchPosts();
  }, [navigate]);

  const handlePostCreated = (newPost) => {
    setPosts((currentPosts) => [newPost, ...currentPosts]);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((currentPosts) => {
      const alreadyExists = currentPosts.some(
        (item) => item._id === updatedPost._id,
      );

      if (alreadyExists) {
        return currentPosts.map((item) =>
          item._id === updatedPost._id ? updatedPost : item,
        );
      }

      return [updatedPost, ...currentPosts];
    });
  };

  const handlePostDeleted = (postId) => {
    setPosts((currentPosts) =>
      currentPosts.filter((item) => item._id !== postId),
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className="feed-page">
      <div className="feed-layout">
        <div className="feed-main-column">
          <section className="feed-panel feed-hero">
            <h1>Community Feed</h1>
            <p>
              Share updates, internship wins, advice, and opportunities with
              students and companies.
            </p>
          </section>

          <CreatePostBox currentUser={user} onPostCreated={handlePostCreated} />

          {error && <div className="feed-panel feed-error-box">{error}</div>}

          {loading ? (
            <div className="feed-panel feed-status-box">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="feed-panel feed-empty-box">
              <h3>No posts yet</h3>
              <p>Be the first one to post something for the community.</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPostUpdated={handlePostUpdated}
                onPostCreated={handlePostCreated}
                onPostDeleted={handlePostDeleted}
              />
            ))
          )}
        </div>

        
      </div>
    </div>
  );
}

export default Feed;
