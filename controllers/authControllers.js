import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import redis from "../utils/redisClient.js";

dotenv.config();

// User login → Generate and store JWT
export const login = async (req, res) => {
  try {
    // Get the full payload (entire JSON body)
    const payload = req.body;

    if (!payload || Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "Payload is required" });
    }

    // Extract userId or fallback (so you can still identify who the token belongs to)
    const userId = payload.userId || payload.id || payload.email;

    if (!userId) {
      return res.status(400).json({ message: "A user identifier (userId, id, or email) is required" });
    }

    // Create JWT with full payload stored inside
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    // Store token in Redis with 1-hour expiry
    await redis.set(`user:${userId}:token`, token, "EX", 3600);

    // Send full JSON response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      payload, // returning the same payload for confirmation
    });
  } catch (error) {
    console.error("Login error:", error);
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
