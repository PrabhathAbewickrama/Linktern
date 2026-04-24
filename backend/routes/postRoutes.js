const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const {
  createPost,
  getPosts,
  getMyPosts,
  getPostsByUser,
  getPostById,
  updatePost,
  toggleLike,
  addComment,
  sharePost,
  deletePost,
} = require("../controllers/postController");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `post-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed for post uploads"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const handlePostUpload = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      return res.status(400).json({
        message: "Image size must be 5MB or less",
      });
    }

    return res.status(400).json({
      message: error.message || "Image upload failed",
    });
  });
};

router.use(protect);

router.route("/").post(handlePostUpload, createPost).get(getPosts);
router.get("/me", getMyPosts);
router.get("/user/:userId", getPostsByUser);
router.get("/:id", getPostById);
router.put("/:id", handlePostUpload, updatePost);
router.put("/:id/like", toggleLike);
router.post("/:id/comments", addComment);
router.post("/:id/share", sharePost);
router.delete("/:id", deletePost);

module.exports = router;
