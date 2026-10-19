import type { Request } from "express";
import type { CreateUserInput } from "@dwd-jev/shared";
import { userService } from "../container.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body as CreateUserInput);
  res.success(user, 201);
});

export const getApprovedUsers = asyncHandler(async (req, res) => {
  const users = await userService.getApprovedUsers(req.user!.role);
  res.success(users, 200);
});

export const getUserById = asyncHandler<Request<{ id: string }>>(async (req, res) => {
  const user = await userService.getUserById(req.params.id, req.user!.role);
  res.success(user, 200);
});
