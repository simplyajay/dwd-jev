import { Router } from "express";
import { authRouter } from "./authRoutes.js";
import { jevRouter } from "./jevRoutes.js";
import { userRouter } from "./userRoutes.js";

export const router = Router();

router.use("/users", userRouter);
router.use("/auth", authRouter);
router.use("/jev", jevRouter);
