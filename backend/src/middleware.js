const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { userModel } = require("./model");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

async function authMiddleware(req, res, next) {
  const authorization = req.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : null;
  const token = req.cookies?.token || bearerToken;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (error) {
    if (error.message === "JWT_SECRET is not configured") {
      return next(error);
    }
    return res.status(401).json({ message: "Invalid or expired authentication token" });
  }

  if (!decoded?.userId || !mongoose.isValidObjectId(decoded.userId)) {
    return res.status(401).json({ message: "Invalid authentication token" });
  }

  try {
    const user = await userModel.findById(decoded.userId).select("username").lean();
    if (!user) {
      return res.status(401).json({ message: "Authenticated user no longer exists" });
    }

    req.userId = user._id.toString();
    req.authUser = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  authMiddleware,
  getJwtSecret,
};
