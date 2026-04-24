const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const getDurationLabel = (startDate, endDate) => {
  if (!startDate || !endDate) return "";

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return "";
  }

  const oneDayMs = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, Math.ceil((end - start) / oneDayMs) + 1);
  const months = Math.floor(totalDays / 30);
  const remainingDays = totalDays % 30;

  if (months > 0 && remainingDays > 0) {
    return `${months} month(s) ${remainingDays} day(s)`;
  }

  if (months > 0) {
    return `${months} month(s)`;
  }

  return `${totalDays} day(s)`;
};

const sanitizeUserForProfile = (user) => {
  const plainUser = user.toObject ? user.toObject() : user;
  const reviews = Array.isArray(plainUser.reviews)
    ? [...plainUser.reviews].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt),
      )
    : [];

  return {
    ...plainUser,
    reviews,
  };
};

const recalculateCompanyRating = (company) => {
  const reviews = Array.isArray(company.reviews) ? company.reviews : [];
  company.ratingCount = reviews.length;
  company.averageRating = reviews.length
    ? Number(
        (
          reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
          reviews.length
        ).toFixed(1),
      )
    : 0;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Get user profile
router.get("/profile", authMiddleware.protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(sanitizeUserForProfile(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put(
  "/profile",
  authMiddleware.protect,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const { name, username, university, degree, gpa, skills } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (username) {
        // Check if username is already taken
        const existingUser = await User.findOne({
          username,
          _id: { $ne: req.user.id },
        });
        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" });
        }
        updateData.username = username;
      }

      // Student-specific fields
      if (university !== undefined) updateData.university = university;
      if (degree !== undefined) updateData.degree = degree;
      if (gpa !== undefined) updateData.gpa = parseFloat(gpa) || 0;
      if (skills !== undefined)
        updateData.skills = Array.isArray(skills)
          ? skills
          : skills
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s);

      if (req.file) {
        updateData.profilePicture = `/uploads/${req.file.filename}`;
      }

      const user = await User.findByIdAndUpdate(req.user.id, updateData, {
        new: true,
      }).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Profile updated successfully",
        user: sanitizeUserForProfile(user),
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// Delete own student account
router.delete("/profile", authMiddleware.protect, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only student accounts can delete themselves from this page",
      });
    }

    const user = await User.findById(req.user.id).select("_id role");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await Post.deleteMany({ author: user._id });

    await Post.updateMany(
      {},
      {
        $pull: {
          likes: user._id,
          comments: { user: user._id },
        },
      },
    );

    const companiesWithReview = await User.find({
      role: "company",
      "reviews.student": user._id,
    });

    for (const company of companiesWithReview) {
      company.reviews = company.reviews.filter(
        (item) => String(item.student) !== String(user._id),
      );
      recalculateCompanyRating(company);
      await company.save();
    }

    await User.findByIdAndDelete(user._id);

    return res.json({ message: "Student account deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get any user profile by id (used for company profile viewing)
router.get("/:id", authMiddleware.protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(sanitizeUserForProfile(user));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Students can rate companies
router.post("/:id/rate", authMiddleware.protect, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can rate companies",
      });
    }

    const rating = Number(req.body.rating);
    const review = (req.body.review || "").trim();
    const internshipTitle = (
      req.body.internshipTitle || "Internship Experience"
    ).trim();
    const workMode = (req.body.workMode || "Not specified").trim();
    const pros = (req.body.pros || "").trim();
    const cons = (req.body.cons || "").trim();
    const recommendations = (req.body.recommendations || "").trim();
    const stipend = Number(req.body.stipend || 0);
    const startDate = req.body.startDate ? new Date(req.body.startDate) : null;
    const endDate = req.body.endDate ? new Date(req.body.endDate) : null;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be a whole number between 1 and 5",
      });
    }

    if (review.length < 50) {
      return res.status(400).json({
        message: "Review must be at least 50 characters long",
      });
    }

    if (Number.isNaN(stipend) || stipend < 0) {
      return res.status(400).json({
        message: "Stipend must be a valid positive number",
      });
    }

    if (
      (startDate && Number.isNaN(startDate.getTime())) ||
      (endDate && Number.isNaN(endDate.getTime()))
    ) {
      return res.status(400).json({
        message: "Please provide a valid start and end date",
      });
    }

    if (startDate && endDate && endDate < startDate) {
      return res.status(400).json({
        message: "End date must be after the start date",
      });
    }

    const company = await User.findById(req.params.id).select("-password");

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (company.role !== "company") {
      return res.status(400).json({
        message: "Only company accounts can be rated",
      });
    }

    const student = await User.findById(req.user.id).select(
      "name username profilePicture",
    );
    const companyName = company.companyName || company.name || "Company";
    const durationLabel = getDurationLabel(startDate, endDate);

    const existingReview = company.reviews.find(
      (item) => String(item.student) === String(req.user.id),
    );

    if (existingReview) {
      existingReview.companyName = companyName;
      existingReview.internshipTitle = internshipTitle;
      existingReview.workMode = workMode;
      existingReview.startDate = startDate;
      existingReview.endDate = endDate;
      existingReview.durationLabel = durationLabel;
      existingReview.stipend = stipend;
      existingReview.rating = rating;
      existingReview.review = review;
      existingReview.pros = pros;
      existingReview.cons = cons;
      existingReview.recommendations = recommendations;
      existingReview.studentName = student?.name || req.user.name || "Student";
      existingReview.studentUsername =
        student?.username || req.user.username || "";
      existingReview.studentProfilePicture =
        student?.profilePicture || req.user.profilePicture || "";
    } else {
      company.reviews.push({
        student: req.user.id,
        studentName: student?.name || req.user.name || "Student",
        studentUsername: student?.username || req.user.username || "",
        studentProfilePicture:
          student?.profilePicture || req.user.profilePicture || "",
        companyName,
        internshipTitle,
        workMode,
        startDate,
        endDate,
        durationLabel,
        stipend,
        rating,
        review,
        pros,
        cons,
        recommendations,
      });
    }

    recalculateCompanyRating(company);
    await company.save();

    return res.status(existingReview ? 200 : 201).json({
      message: existingReview
        ? "Company rating updated successfully"
        : "Company rated successfully",
      user: sanitizeUserForProfile(company),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Students can delete their own rating from a company profile
router.delete("/:id/rate", authMiddleware.protect, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can delete company ratings",
      });
    }

    const company = await User.findById(req.params.id).select("-password");

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (company.role !== "company") {
      return res.status(400).json({
        message: "Only company accounts can be rated",
      });
    }

    const reviewIndex = company.reviews.findIndex(
      (item) => String(item.student) === String(req.user.id),
    );

    if (reviewIndex === -1) {
      return res.status(404).json({
        message: "Your rating was not found for this company",
      });
    }

    company.reviews.splice(reviewIndex, 1);
    recalculateCompanyRating(company);
    await company.save();

    return res.json({
      message: "Company rating deleted successfully",
      user: sanitizeUserForProfile(company),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
