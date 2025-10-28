import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redis = new Redis({
    host: process.env.REDIS_HOST,        // e.g. redis-11452.c321.us-east-1-2.ec2.redns.redis-cloud.com
  port: process.env.REDIS_PORT,        // e.g. 11452
  username: "default",                 // Redis Cloud always uses 'default'
  password: process.env.REDIS_PASSWORD,
  ssl: {},                              // required for Redis Cloud SSL/TLS
});

// const redis = new Redis(`rediss://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", err => console.error("❌ Redis error:", err));

export default redis;
