import { Router } from "express";
import { CreateUserSchema } from "@dwd-jev/shared";
import { createUser } from "../controllers/userController.js";
import { validateBody } from "../middleware/validate.js";

export const userRouter = Router();

userRouter.post("/register", validateBody(CreateUserSchema), createUser);
