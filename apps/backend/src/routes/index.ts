import { Router } from "express";
import { adminUserRouter } from "./adminUserRoutes.js";
import { authRouter } from "./authRoutes.js";
import { jevRouter } from "./jevRoutes.js";
import { userRouter } from "./userRoutes.js";
import { rateLimit } from "../middleware/rateLimit.js";

export const router = Router();

// Per IP, on top of the route limiters; before authenticate, so no user id yet.
router.use(rateLimit({ windowSeconds: 60, max: 300, keyPrefix: "global" }));

router.use("/users", userRouter);
router.use("/admin/users", adminUserRouter);
router.use("/auth", authRouter);
router.use("/jev", jevRouter);
