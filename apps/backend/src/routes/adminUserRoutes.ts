import { Router } from "express";
import {
  ConfirmPasswordInputSchema,
  SetUserRoleInputSchema,
  SetUserStatusInputSchema,
} from "@dwd-jev/shared";
import {
  approveUser,
  getPendingUsers,
  rejectUser,
  setUserRole,
  setUserStatus,
} from "../controllers/adminUserController.js";
import { authenticate } from "../middleware/authenticate.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { requireRole } from "../middleware/requireRole.js";
import { IdParamSchema, validateBody, validateParams } from "../middleware/validate.js";

// Keyed per admin, not per IP.
const pendingApprovalRateLimit = rateLimit({
  windowSeconds: 60,
  max: 30,
  keyPrefix: "pending-approval",
  keyBy: (req) => req.user?.sub,
});

const userStatusRateLimit = rateLimit({
  windowSeconds: 60,
  max: 10,
  keyPrefix: "user-status",
  keyBy: (req) => req.user?.sub,
});

const userRoleRateLimit = rateLimit({
  windowSeconds: 60,
  max: 10,
  keyPrefix: "user-role",
  keyBy: (req) => req.user?.sub,
});

const validateId = validateParams(IdParamSchema);

export const adminUserRouter = Router();

adminUserRouter.use(authenticate, requireRole("administrator"));

adminUserRouter.get("/pending", getPendingUsers);

adminUserRouter.post(
  "/:id/approve",
  validateId,
  pendingApprovalRateLimit,
  validateBody(ConfirmPasswordInputSchema),
  approveUser,
);
adminUserRouter.post(
  "/:id/reject",
  validateId,
  pendingApprovalRateLimit,
  validateBody(ConfirmPasswordInputSchema),
  rejectUser,
);
adminUserRouter.patch(
  "/:id/status",
  validateId,
  userStatusRateLimit,
  validateBody(SetUserStatusInputSchema),
  setUserStatus,
);
adminUserRouter.patch(
  "/:id/role",
  validateId,
  userRoleRateLimit,
  validateBody(SetUserRoleInputSchema),
  setUserRole,
);
