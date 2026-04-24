const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getPreferredDisplayName = ({
  role = "",
  name = "",
  username = "",
  companyName = "",
} = {}) => {
  if (role === "company") {
    return companyName || name || username || "Company";
  }

  return name || username || "Student";
};

const getCurrentUserSnapshot = async (req) => {
  const fallbackUser = {
    _id: req.user._id || req.user.id,
    id: req.user.id || req.user._id,
    role: req.user.role,
    name: req.user.name || "",
    username: req.user.username || "",
    companyName: req.user.companyName || "",
    profilePicture: req.user.profilePicture || "",
  };

  try {
    const freshUser = await User.findById(fallbackUser.id).select(
      "name username role companyName profilePicture",
    );

    if (!freshUser) {
      return fallbackUser;
    }

    return {
      _id: freshUser._id,
      id: freshUser._id.toString(),
      role: freshUser.role,
      name: freshUser.name || "",
      username: freshUser.username || "",
      companyName: freshUser.companyName || "",
      profilePicture: freshUser.profilePicture || "",
    };
  } catch (error) {
    return fallbackUser;
  }
};

const buildPostQuery = (filter = {}) =>
  Post.find(filter).populate({
    path: "originalPost",
    model: "Post",
  });

const sanitizeComment = (comment) => ({
  _id: comment._id,
  userId: comment.user,
  userRole: comment.userRole,
  userDisplayName: getPreferredDisplayName({
    role: comment.userRole,
    name: comment.userName,
    username: comment.userUsername,
    companyName: comment.userCompanyName,
  }),
  userProfilePicture: comment.userProfilePicture || null,
  text: comment.text,
  createdAt: comment.createdAt,
});

const sanitizePost = (post, currentUserId) => {
  const likedByCurrentUser = Array.isArray(post.likes)
    ? post.likes.some((item) => item.toString() === String(currentUserId))
    : false;

  const comments = Array.isArray(post.comments)
    ? post.comments.map((comment) => sanitizeComment(comment))
    : [];

  const sharedPost = post.originalPost
    ? {
        _id: post.originalPost._id,
        content: post.originalPost.content || "",
        image: post.originalPost.image || "",
        isAnonymous: post.originalPost.isAnonymous === true,
        authorRole: post.originalPost.isAnonymous
          ? null
          : post.originalPost.authorRole,
        authorDisplayName: post.originalPost.isAnonymous
          ? "Anonymous"
          : getPreferredDisplayName({
              role: post.originalPost.authorRole,
              name: post.originalPost.authorName,
              username: post.originalPost.authorUsername,
              companyName: post.originalPost.authorCompanyName,
            }),
        authorProfilePicture: post.originalPost.isAnonymous
          ? null
          : post.originalPost.authorProfilePicture || null,
        createdAt: post.originalPost.createdAt,
        updatedAt: post.originalPost.updatedAt,
        likeCount:
          typeof post.originalPost.likeCount === "number"
            ? post.originalPost.likeCount
            : Array.isArray(post.originalPost.likes)
              ? post.originalPost.likes.length
              : 0,
        commentCount: Array.isArray(post.originalPost.comments)
          ? post.originalPost.comments.length
          : 0,
        shareCount: post.originalPost.shareCount || 0,
      }
    : null;

  return {
    _id: post._id,
    authorId: post.isAnonymous ? null : post.author,
    postType: post.postType || (post.originalPost ? "share" : "post"),
    isShared: Boolean(post.originalPost),
    content: post.content || "",
    image: post.image || "",
    isAnonymous: post.isAnonymous === true,
    authorRole: post.isAnonymous ? null : post.authorRole,
    authorDisplayName: post.isAnonymous
      ? "Anonymous"
      : getPreferredDisplayName({
          role: post.authorRole,
          name: post.authorName,
          username: post.authorUsername,
          companyName: post.authorCompanyName,
        }),
    authorProfilePicture: post.isAnonymous
      ? null
      : post.authorProfilePicture || null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    likeCount:
      typeof post.likeCount === "number" ? post.likeCount : post.likes.length,
    commentCount: comments.length,
    shareCount: post.shareCount || 0,
    isLikedByCurrentUser: likedByCurrentUser,
    canEdit: currentUserId
      ? String(post.author) === String(currentUserId)
      : false,
    canDelete: currentUserId
      ? String(post.author) === String(currentUserId)
      : false,
    sharedPost,
    comments,
  };
};

exports.createPost = async (req, res) => {
  try {
    const content = (req.body.content || "").trim();
    const image = req.file ? `/uploads/${req.file.filename}` : "";
    const isAnonymous =
      req.body.isAnonymous === true || req.body.isAnonymous === "true";

    if (!content && !image) {
      return res.status(400).json({
        message: "Post content or an image is required",
      });
    }

    const currentUser = await getCurrentUserSnapshot(req);

    const post = await Post.create({
      author: currentUser.id,
      authorRole: currentUser.role,
      authorName: currentUser.name,
      authorUsername: currentUser.username,
      authorCompanyName: currentUser.companyName,
      authorProfilePicture: currentUser.profilePicture,
      content,
      image,
      isAnonymous,
      postType: "post",
    });

    return res.status(201).json({
      message: "Post created successfully",
      post: sanitizePost(post, req.user.id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const posts = await buildPostQuery({}).sort({ createdAt: -1 });

    return res.json({
      posts: posts.map((post) => sanitizePost(post, req.user.id)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const posts = await buildPostQuery({ author: req.user.id }).sort({
      createdAt: -1,
    });

    return res.json({
      posts: posts.map((post) => sanitizePost(post, req.user.id)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const posts = await buildPostQuery({ author: userId }).sort({
      createdAt: -1,
    });

    return res.json({
      posts: posts.map((post) => sanitizePost(post, req.user.id)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await buildPostQuery({ _id: id }).findOne();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.json({ post: sanitizePost(post, req.user.id) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (String(post.author) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "You can only edit your own posts" });
    }

    const nextContent =
      typeof req.body.content === "string"
        ? req.body.content.trim()
        : post.content;
    const removeImage =
      req.body.removeImage === true || req.body.removeImage === "true";

    post.content = nextContent;

    if (req.file) {
      post.image = `/uploads/${req.file.filename}`;
    } else if (removeImage) {
      post.image = "";
    }

    if (typeof req.body.isAnonymous !== "undefined") {
      post.isAnonymous =
        req.body.isAnonymous === true || req.body.isAnonymous === "true";
    }

    if (post.postType !== "share" && !post.content && !post.image) {
      return res.status(400).json({
        message: "Post content or an image is required",
      });
    }

    await post.save();

    const refreshedPost = await buildPostQuery({ _id: post._id }).findOne();

    return res.json({
      message: "Post updated successfully",
      post: sanitizePost(refreshedPost, req.user.id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const currentUserId = String(req.user.id);
    const existingLikeIndex = post.likes.findIndex(
      (item) => item.toString() === currentUserId,
    );

    if (existingLikeIndex >= 0) {
      post.likes.splice(existingLikeIndex, 1);
    } else {
      post.likes.push(req.user.id);
    }

    post.likeCount = post.likes.length;
    await post.save();

    const refreshedPost = await buildPostQuery({ _id: post._id }).findOne();

    return res.json({
      message: existingLikeIndex >= 0 ? "Post unliked" : "Post liked",
      post: sanitizePost(refreshedPost, req.user.id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const text = (req.body.text || "").trim();

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    if (!text) {
      return res.status(400).json({ message: "Comment text cannot be empty" });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const currentUser = await getCurrentUserSnapshot(req);

    post.comments.push({
      user: currentUser.id,
      userRole: currentUser.role,
      userName: currentUser.name,
      userUsername: currentUser.username,
      userCompanyName: currentUser.companyName,
      userProfilePicture: currentUser.profilePicture,
      text,
    });

    await post.save();

    const refreshedPost = await buildPostQuery({ _id: post._id }).findOne();

    return res.status(201).json({
      message: "Comment added successfully",
      post: sanitizePost(refreshedPost, req.user.id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const shareCaption = (req.body.content || "").trim();

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await buildPostQuery({ _id: id }).findOne();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const sourcePost = post.originalPost || post;
    const currentUser = await getCurrentUserSnapshot(req);

    const sharedPost = await Post.create({
      author: currentUser.id,
      authorRole: currentUser.role,
      authorName: currentUser.name,
      authorUsername: currentUser.username,
      authorCompanyName: currentUser.companyName,
      authorProfilePicture: currentUser.profilePicture,
      content: shareCaption,
      image: "",
      isAnonymous: false,
      postType: "share",
      originalPost: sourcePost._id,
    });

    sourcePost.shareCount += 1;
    await sourcePost.save();

    const populatedSharedPost = await buildPostQuery({
      _id: sharedPost._id,
    }).findOne();

    const refreshedSourcePost = await buildPostQuery({
      _id: sourcePost._id,
    }).findOne();

    return res.status(201).json({
      message: "Post shared to your profile",
      sharedPost: sanitizePost(populatedSharedPost, req.user.id),
      sourcePost: sanitizePost(refreshedSourcePost, req.user.id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (String(post.author) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own posts" });
    }

    if (post.originalPost) {
      const sourcePost = await Post.findById(post.originalPost);
      if (sourcePost && sourcePost.shareCount > 0) {
        sourcePost.shareCount -= 1;
        await sourcePost.save();
      }
    }

    await post.deleteOne();

    return res.json({
      message: "Post deleted successfully",
      deletedPostId: id,
      originalPostId: post.originalPost || null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
