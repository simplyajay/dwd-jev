import { Router } from "express";
import { LoginInputSchema, RefreshTokenInputSchema } from "@dwd-jev/shared";
import { login, logout, refresh } from "../controllers/authController.js";
import { validateBody } from "../middleware/validate.js";
import { rateLimit } from "../middleware/rateLimit.js";

export const authRouter = Router();

const loginRateLimit = rateLimit({ windowSeconds: 60, max: 5, keyPrefix: "login" });
const refreshRateLimit = rateLimit({ windowSeconds: 60, max: 10, keyPrefix: "refresh" });

authRouter.post("/login", loginRateLimit, validateBody(LoginInputSchema), login);
authRouter.post("/refresh", refreshRateLimit, validateBody(RefreshTokenInputSchema), refresh);
authRouter.post("/logout", validateBody(RefreshTokenInputSchema), logout);
