const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token = req.headers.authorization;

  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    token = token.split(" ")[1];
    const decoded = jwt.verify(token, "secret123");

    req.user = {
      ...decoded,
      _id: decoded._id || decoded.id,
      id: decoded.id || decoded._id
    };
    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

const companyOnly = (req, res, next) => {
  if (req.user.role !== "company") {
    return res.status(403).json({ message: "Only companies can access this" });
  }
  next();
};

const studentOnly = (req, res, next) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Only students can access this" });
  }
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

module.exports = { protect, companyOnly, studentOnly, adminOnly };