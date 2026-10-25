import type { Request } from "express";
import type {
  CreateUserInput,
  UpdateAccountInput,
  UpdateProfileInput,
} from "@dwd-jev/shared";
import { authService, userService } from "../container.js";
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

export const updateMyProfile = asyncHandler<Request<any, any, UpdateProfileInput>>(
  async (req, res) => {
    const user = await userService.updateProfile(req.user!.sub, req.body);
    res.success(user, 200);
  },
);

export const updateMyAccount = asyncHandler<Request<any, any, UpdateAccountInput>>(
  async (req, res) => {
    const result = await authService.updateAccount(req.user!.sub, req.body);
    res.success(result, 200);
  },
);
