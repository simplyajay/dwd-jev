import type { CreateUserInput } from "@dwd-jev/shared";
import { userService } from "../container.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body as CreateUserInput);
  res.success(user, 201);
});
