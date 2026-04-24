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

  const displayName =
    user.role === "company"
      ? user.companyName || user.name || "Company"
      : user.name || user.username || "Student";
  const profileCaption =
    user.role === "company"
      ? "Build your employer brand and connect with student talent."
      : "Share wins, ask questions, and grow your internship network.";
  const quickStats = [
    { label: "Posts in feed", value: posts.length },
    { label: "Profile type", value: user.role === "company" ? "Company" : "Student" },
    { label: "Community mode", value: "Active" },
  ];

  return (
    <div className="feed-page">
      <div className="feed-layout">
        <aside className="feed-side-column">
          <section className="feed-panel feed-profile-card">
            <div className="feed-profile-cover" />
            <div className="feed-profile-body">
              <div className="feed-profile-avatar">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              <h2>{displayName}</h2>
              <p>{user.email}</p>
              <span className="feed-profile-role">
                {user.role === "company" ? "Company Account" : "Student Account"}
              </span>
              <p className="feed-profile-caption">{profileCaption}</p>
            </div>
            <div className="feed-profile-stats">
              {quickStats.map((item) => (
                <div key={item.label} className="feed-profile-stat">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="feed-panel side-tip-card">
            <h3>Post Ideas</h3>
            <ul>
              <li>Share internship wins or hiring updates.</li>
              <li>Ask for feedback on CVs, interviews, or portfolios.</li>
              <li>Highlight projects, events, or openings.</li>
            </ul>
          </section>
        </aside>

        <div className="feed-main-column">
          <section className="feed-panel feed-hero">
            <div className="feed-hero-copy">
              <span className="feed-hero-badge">Professional Network</span>
              <h1>Community Feed</h1>
              <p>
                Share internship wins, advice, openings, and career updates in
                a feed designed to feel more like a professional network.
              </p>
            </div>
            <div className="feed-hero-highlights">
              <div className="feed-highlight-card">
                <strong>Build presence</strong>
                <span>Show projects, wins, and company culture.</span>
              </div>
              <div className="feed-highlight-card">
                <strong>Start conversations</strong>
                <span>Turn posts into meaningful comments and connections.</span>
              </div>
            </div>
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

        <aside className="feed-side-column feed-right-column">
          <section className="feed-panel side-tip-card">
            <h3>Feed Tips</h3>
            <ul>
              <li>Short, clear posts usually get more replies.</li>
              <li>Use images for project demos or event highlights.</li>
              <li>Reshare useful advice so more people can benefit.</li>
            </ul>
          </section>

          <section className="feed-panel side-tip-card">
            <h3>Community Focus</h3>
            <ul>
              <li>Students can share learning progress and interview updates.</li>
              <li>Companies can post roles, hiring signals, and culture moments.</li>
              <li>Keep posts practical, supportive, and career-focused.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Feed;
