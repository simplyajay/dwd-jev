import type { Request } from "express";
import type {
  ConfirmPasswordInput,
  CreateJevInput,
  JevByDateRangeInput,
  JevByIdQuery,
  JevByMonthInput,
  UpdateJevInput,
} from "@dwd-jev/shared";
import { jevService } from "../container.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createJev = asyncHandler<Request<any, any, CreateJevInput>>(
  async (req, res) => {
    const jev = await jevService.createJev(req.body, req.user!.sub);
    res.success(jev, 201);
  },
);

export const getJevById = asyncHandler<Request<{ id: string }>>(async (req, res) => {
  const { includeDeleted } = res.locals.query as JevByIdQuery;
  const jev = await jevService.getJevById(req.params.id, includeDeleted);
  res.success(jev, 200);
});

export const getJevRevision = asyncHandler<Request<{ id: string }>>(async (req, res) => {
  const revision = await jevService.getJevRevision(req.params.id);
  res.success(revision, 200);
});

export const updateJev = asyncHandler<Request<{ id: string }, any, UpdateJevInput>>(
  async (req, res) => {
    const { password, ...input } = req.body;
    const jev = await jevService.updateJev(req.params.id, input, req.user!.sub, password);
    res.success(jev, 200);
  },
);

export const deleteJev = asyncHandler<Request<{ id: string }, any, ConfirmPasswordInput>>(
  async (req, res) => {
    await jevService.deleteJev(req.params.id, req.user!.sub, req.body.password);
    res.success(null, 200);
  },
);

export const getJevsByMonth = asyncHandler<Request<any, any, JevByMonthInput>>(
  async (req, res) => {
    const { year, month, page, pageSize } = req.body;
    const result = await jevService.getJevsByMonth(year, month, { page, pageSize });
    res.success(result, 200);
  },
);

export const getJevsByDateRange = asyncHandler<Request<any, any, JevByDateRangeInput>>(
  async (req, res) => {
    const { startDate, endDate, page, pageSize, searchKeyword } = req.body;
    const result = await jevService.getJevsByDateRange(
      startDate,
      endDate,
      { page, pageSize },
      searchKeyword,
    );
    res.success(result, 200);
  },
);
