const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userRole: {
      type: String,
      enum: ["student", "company"],
      required: true,
    },
    userName: {
      type: String,
      default: "",
    },
    userUsername: {
      type: String,
      default: "",
    },
    userCompanyName: {
      type: String,
      default: "",
    },
    userProfilePicture: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorRole: {
      type: String,
      enum: ["student", "company"],
      required: true,
    },
    authorName: {
      type: String,
      default: "",
    },
    authorUsername: {
      type: String,
      default: "",
    },
    authorCompanyName: {
      type: String,
      default: "",
    },
    authorProfilePicture: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },
    image: {
      type: String,
      default: "",
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    postType: {
      type: String,
      enum: ["post", "share"],
      default: "post",
    },
    originalPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    comments: [commentSchema],
    shareCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

postSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
