import type { LoginInput, RefreshTokenInput } from "@dwd-jev/shared";
import { authService } from "../container.js";
import { redis } from "../lib/redis.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.login(
    req.body as LoginInput,
    redis,
  );
  res.success({ accessToken, refreshToken, user }, 200);
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken: oldRefreshToken } = req.body as RefreshTokenInput;
  const { accessToken, refreshToken } = await authService.refresh(oldRefreshToken, redis);
  res.success({ accessToken, refreshToken }, 200);
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body as RefreshTokenInput;
  await authService.logout(refreshToken, redis);
  res.success(null, 200);
});
