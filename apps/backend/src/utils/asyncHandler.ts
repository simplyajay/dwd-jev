import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRouteHandler<Req> = (req: Req, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler =
  <Req extends Request = Request>(fn: AsyncRouteHandler<Req>): RequestHandler =>
  (req, res, next) => {
    fn(req as Req, res, next).catch(next);
  };
