import jwt from "jsonwebtoken";
import User from "../models/User.models.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded should have: { userId: "..." }

    const user = await User.findById(decoded.userId);
    // no need to exclude password if you don't have one

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware:", error.message);
    res.status(401).json({ message: "Unauthorized - Invalid or expired token" });
  }
};
