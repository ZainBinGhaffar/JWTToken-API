import express from "express";
import { login, logout, checkToken } from "../controllers/authControllers.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", verifyJWT, logout);
router.get("/check/:userId", verifyJWT, checkToken);

export default router;
