import { Router } from "express";
import {
  CreateJevInputSchema,
  JevByDateRangeInputSchema,
  JevByMonthInputSchema,
} from "@dwd-jev/shared";
import {
  createJev,
  deleteJev,
  getJevById,
  getJevsByDateRange,
  getJevsByMonth,
  updateJev,
} from "../controllers/jevController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";

export const jevRouter = Router();

jevRouter.use(authenticate);

jevRouter.post("/list", validateBody(JevByMonthInputSchema), getJevsByMonth);
jevRouter.post(
  "/list/search-range",
  validateBody(JevByDateRangeInputSchema),
  getJevsByDateRange,
);

jevRouter.post("/new", validateBody(CreateJevInputSchema), createJev);
jevRouter.get("/:id", getJevById);
jevRouter.put("/:id", validateBody(CreateJevInputSchema), updateJev);
jevRouter.delete("/:id", deleteJev);
