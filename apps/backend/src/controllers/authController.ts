import { authService } from "../container.js";
import { redis } from "../lib/redis.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { LoginInput, RefreshTokenInput } from "@dwd-jev/shared";
import type { Request } from "express";

export const login = asyncHandler(async (req: Request<any, any, LoginInput>, res) => {
  const { accessToken, refreshToken, user } = await authService.login(req.body, redis);
  res.success({ accessToken, refreshToken, user }, 200);
});

export const refresh = asyncHandler(
  async (req: Request<any, any, RefreshTokenInput>, res) => {
    const { refreshToken: oldRefreshToken } = req.body;
    const { accessToken, refreshToken } = await authService.refresh(
      oldRefreshToken,
      redis,
    );
    res.success({ accessToken, refreshToken }, 200);
  },
);

export const logout = asyncHandler(
  async (req: Request<any, any, RefreshTokenInput>, res) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken, redis);
    res.success(null, 200);
  },
);
