import { Router } from "express";
import { CreateUserSchema } from "@dwd-jev/shared";
import { createUser, getApprovedUsers, getUserById } from "../controllers/userController.js";
import { authenticate } from "../middleware/authenticate.js";
import { IdParamSchema, validateBody, validateParams } from "../middleware/validate.js";

export const userRouter = Router();

userRouter.post("/register", validateBody(CreateUserSchema), createUser);

userRouter.get("/", authenticate, getApprovedUsers);
userRouter.get("/:id", authenticate, validateParams(IdParamSchema), getUserById);
