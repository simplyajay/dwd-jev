import type { Request } from "express";
import type {
  ConfirmPasswordInput,
  SetUserRoleInput,
  SetUserStatusInput,
} from "@dwd-jev/shared";
import { userService } from "../container.js";
import { redis } from "../lib/redis.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getPendingUsers = asyncHandler(async (_req, res) => {
  const users = await userService.getPendingUsers();
  res.success(users, 200);
});

export const approveUser = asyncHandler<
  Request<{ id: string }, any, ConfirmPasswordInput>
>(async (req, res) => {
  const user = await userService.approveUser(
    req.params.id,
    req.user!.sub,
    req.body.password,
  );
  res.success(user, 200);
});

export const rejectUser = asyncHandler<
  Request<{ id: string }, any, ConfirmPasswordInput>
>(async (req, res) => {
  await userService.rejectUser(req.params.id, req.user!.sub, req.body.password);
  res.success(null, 200);
});

export const setUserStatus = asyncHandler<
  Request<{ id: string }, any, SetUserStatusInput>
>(async (req, res) => {
  const { status, password } = req.body;
  const user = await userService.setUserStatus(
    req.params.id,
    status,
    req.user!.sub,
    password,
    redis,
  );
  res.success(user, 200);
});

export const setUserRole = asyncHandler<Request<{ id: string }, any, SetUserRoleInput>>(
  async (req, res) => {
    const { role, password } = req.body;
    const user = await userService.setUserRole(
      req.params.id,
      role,
      req.user!.sub,
      password,
    );
    res.success(user, 200);
  },
);
