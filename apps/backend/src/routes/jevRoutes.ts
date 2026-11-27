import { Router } from "express";
import {
  ConfirmPasswordInputSchema,
  CreateJevInputSchema,
  JevByDateRangeInputSchema,
  JevByIdQuerySchema,
  JevByMonthInputSchema,
  UpdateJevInputSchema,
} from "@dwd-jev/shared";
import {
  createJev,
  deleteJev,
  getJevById,
  getJevRevision,
  getJevsByDateRange,
  getJevsByMonth,
  updateJev,
} from "../controllers/jevController.js";
import { authenticate } from "../middleware/authenticate.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  IdParamSchema,
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.js";

// Per user, since update and delete take a password.
const jevUpdateRateLimit = rateLimit({
  windowSeconds: 60,
  max: 20,
  keyPrefix: "jev-update",
  keyBy: (req) => req.user?.sub,
});

const jevDeleteRateLimit = rateLimit({
  windowSeconds: 60,
  max: 10,
  keyPrefix: "jev-delete",
  keyBy: (req) => req.user?.sub,
});

export const jevRouter = Router();

jevRouter.use(authenticate);

jevRouter.post("/list", validateBody(JevByMonthInputSchema), getJevsByMonth);
jevRouter.post(
  "/list/search-range",
  validateBody(JevByDateRangeInputSchema),
  getJevsByDateRange,
);

jevRouter.post("/new", validateBody(CreateJevInputSchema), createJev);
jevRouter.get("/revisions/:id", validateParams(IdParamSchema), getJevRevision);
jevRouter.get(
  "/:id",
  validateParams(IdParamSchema),
  validateQuery(JevByIdQuerySchema),
  getJevById,
);
jevRouter.put(
  "/:id",
  jevUpdateRateLimit,
  validateParams(IdParamSchema),
  validateBody(UpdateJevInputSchema),
  updateJev,
);
jevRouter.delete(
  "/:id",
  jevDeleteRateLimit,
  validateParams(IdParamSchema),
  validateBody(ConfirmPasswordInputSchema),
  deleteJev,
);
