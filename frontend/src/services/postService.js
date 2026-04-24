import api from "../api";

const getFeedPosts = async () => {
  const response = await api.get("/posts");
  return response.data?.posts || [];
};

const getPostById = async (postId) => {
  const response = await api.get(`/posts/${postId}`);
  return response.data?.post;
};

const getMyPosts = async () => {
  const response = await api.get("/posts/me");
  return response.data?.posts || [];
};

const getUserPosts = async (userId) => {
  const response = await api.get(`/posts/user/${userId}`);
  return response.data?.posts || [];
};

const createPost = async (data) => {
  const config =
    data instanceof FormData
      ? {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      : undefined;

  const response = await api.post("/posts", data, config);
  return response.data?.post;
};

const updatePost = async (postId, data) => {
  const config =
    data instanceof FormData
      ? {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      : undefined;

  const response = await api.put(`/posts/${postId}`, data, config);
  return response.data?.post;
};

const toggleLike = async (postId) => {
  const response = await api.put(`/posts/${postId}/like`);
  return response.data?.post;
};

const addComment = async (postId, text) => {
  const response = await api.post(`/posts/${postId}/comments`, { text });
  return response.data?.post;
};

const sharePost = async (postId, content = "") => {
  const response = await api.post(`/posts/${postId}/share`, { content });
  return response.data;
};

const deletePost = async (postId) => {
  const response = await api.delete(`/posts/${postId}`);
  return response.data;
};

const postService = {
  getFeedPosts,
  getPostById,
  getMyPosts,
  getUserPosts,
  createPost,
  updatePost,
  toggleLike,
  addComment,
  sharePost,
  deletePost,
};

export {
  getFeedPosts,
  getPostById,
  getMyPosts,
  getUserPosts,
  createPost,
  updatePost,
  toggleLike,
  addComment,
  sharePost,
  deletePost,
};

export default postService;
