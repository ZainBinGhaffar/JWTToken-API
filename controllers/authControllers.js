import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import redis from "../utils/redisClient.js";

dotenv.config();

// User login → Generate and store JWT
export const login = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ message: "User ID required" });

    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // Store token in Redis with 1-hour expiry
    await redis.set(`user:${userId}:token`, token, "EX", 3600);

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// User logout → Invalidate JWT
export const logout = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ message: "User ID required" });

    await redis.del(`user:${userId}:token`);

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Check if token exists in Redis (optional helper)
export const checkToken = async (req, res) => {
  try {
    const { userId } = req.params;

    const token = await redis.get(`user:${userId}:token`);

    if (!token) return res.status(404).json({ message: "No token found" });

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
