const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { createNotification } = require("../utils/notificationService");

const router = express.Router();
const EMAIL_VERIFICATION_TTL_MS = 10 * 60 * 1000;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const isStudentEmail = (email) =>
  email.endsWith("@my.sliit.lk") || email.endsWith("@sliit.lk");

const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      username: user.username,
      companyName: user.companyName,
      profilePicture: user.profilePicture
    },
    "secret123",
    { expiresIn: "7d" }
  );
};

router.post("/register/student/send-code", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!isStudentEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Only SLIIT students can register" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser && existingUser.role !== "student") {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({ message: "Student already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const verificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

    if (existingUser) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.role = "student";
      existingUser.isEmailVerified = false;
      existingUser.emailVerificationCode = verificationCode;
      existingUser.emailVerificationExpiresAt = verificationExpiresAt;
      await existingUser.save();
    } else {
      await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "student",
        isEmailVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationExpiresAt: verificationExpiresAt
      });
    }

    await sendEmail(
      normalizedEmail,
      "Your Linktern verification code",
      `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Verify your student email</h2>
          <p>Hello ${name},</p>
          <p>Your verification code is:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${verificationCode}</p>
          <p>This code expires in 10 minutes.</p>
        </div>
      `
    );

    res.json({ message: "Verification code sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to send verification code" });
  }
});

// Student register
router.post("/register/student", async (req, res) => {
  try {
    const { name, email, password, verificationCode } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password || !verificationCode) {
      return res.status(400).json({ message: "All fields including verification code are required" });
    }

    if (!isStudentEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Only SLIIT students can register" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (!existingUser || existingUser.role !== "student") {
      return res.status(400).json({ message: "Please request a verification code first" });
    }

    if (existingUser.isEmailVerified) {
      return res.status(400).json({ message: "Student already exists" });
    }

    if (
      !existingUser.emailVerificationCode ||
      existingUser.emailVerificationCode !== String(verificationCode).trim()
    ) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (
      !existingUser.emailVerificationExpiresAt ||
      existingUser.emailVerificationExpiresAt.getTime() < Date.now()
    ) {
      existingUser.emailVerificationCode = "";
      existingUser.emailVerificationExpiresAt = null;
      await existingUser.save();
      return res.status(400).json({ message: "Verification code expired. Please request a new code" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    existingUser.name = name;
    existingUser.password = hashedPassword;
    existingUser.isEmailVerified = true;
    existingUser.emailVerificationCode = "";
    existingUser.emailVerificationExpiresAt = null;

    const user = await existingUser.save();

    await createNotification({
      recipient: user._id,
      type: "profile_reminder",
      title: "Complete your student profile",
      message:
        "Welcome to Linktern. Update your university, degree, GPA, and skills before applying for internships.",
      link: "/profile",
      metadata: {
        userId: user._id,
      },
    });

    res.status(201).json({
      message: "Student registered successfully",
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Company register
router.post("/register/company", async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password || !companyName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "Company already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "company",
      companyName
    });

    res.status(201).json({
      message: "Company registered successfully",
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin register
router.post("/register/admin", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "Admin account already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin"
    });

    res.status(201).json({
      message: "Admin registered successfully",
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login for both
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.role === "student" && !user.isEmailVerified) {
      return res.status(400).json({ message: "Please verify your email before logging in" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
