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

    // 1️⃣ Create access token (short expiry)
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    // 2️⃣ Create refresh token (longer expiry)
    const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });

    // 3️⃣ Store both tokens in Redis
    await redis.set(`user:${userId}:accessToken`, accessToken, "EX", 3600);
    await redis.set(`user:${userId}:refreshToken`, refreshToken, "EX", 604800); // 7 days 

    // Send full JSON response
    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
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

    await redis.del(`user:${userId}:accessToken`);
    await redis.del(`user:${userId}:refreshToken`);

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

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const userId = decoded.userId;

    // Check if token exists in Redis
    const storedRefreshToken = await redis.get(`user:${userId}:refreshToken`);
    if (storedRefreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    // Generate new access token
    const newAccessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    // Update Redis
    await redis.set(`user:${userId}:accessToken`, newAccessToken, "EX", 3600);

    res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};