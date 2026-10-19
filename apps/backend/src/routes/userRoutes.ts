import { Router } from "express";
import {
  CreateUserSchema,
  UpdateAccountInputSchema,
  UpdateProfileInputSchema,
} from "@dwd-jev/shared";
import {
  createUser,
  getApprovedUsers,
  getUserById,
  updateMyAccount,
  updateMyProfile,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/authenticate.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { IdParamSchema, validateBody, validateParams } from "../middleware/validate.js";

// Per IP: clients behind one NAT/proxy share this limit.
const registerRateLimit = rateLimit({
  windowSeconds: 60,
  max: 15,
  keyPrefix: "register",
});

const accountUpdateRateLimit = rateLimit({
  windowSeconds: 60,
  max: 10,
  keyPrefix: "account-update",
  keyBy: (req) => req.user?.sub,
});

export const userRouter = Router();

userRouter.post(
  "/register",
  registerRateLimit,
  validateBody(CreateUserSchema),
  createUser,
);

userRouter.put(
  "/me/profile",
  authenticate,
  validateBody(UpdateProfileInputSchema),
  updateMyProfile,
);
userRouter.put(
  "/me/account",
  authenticate,
  accountUpdateRateLimit,
  validateBody(UpdateAccountInputSchema),
  updateMyAccount,
);

userRouter.get("/", authenticate, getApprovedUsers);
userRouter.get("/:id", authenticate, validateParams(IdParamSchema), getUserById);
