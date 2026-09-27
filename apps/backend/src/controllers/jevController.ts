import type { Request } from "express";
import type {
  CreateJevInput,
  JevByDateRangeInput,
  JevByMonthInput,
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
  const jev = await jevService.getJevById(req.params.id);
  res.success(jev, 200);
});

export const updateJev = asyncHandler<Request<{ id: string }, any, CreateJevInput>>(
  async (req, res) => {
    const jev = await jevService.updateJev(req.params.id, req.body, req.user!.sub);
    res.success(jev, 200);
  },
);

export const deleteJev = asyncHandler<Request<{ id: string }>>(async (req, res) => {
  await jevService.deleteJev(req.params.id, req.user!.sub);
  res.success(null, 200);
});

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
