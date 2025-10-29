import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import redis from "../utils/redisClient.js";
dotenv.config();

export const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check Redis if token exists
    const storedToken = await redis.get(`user:${decoded.id}:token`);
    if (storedToken !== token) {
      return res.status(403).json({ message: "Token expired or invalid" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};