import { JevListItemSchema, JevRevisionSchema, JevSchema } from "@dwd-jev/shared";
import { request } from "./http";
import { paginatedSchema } from "./schemas";
import type { Api } from "./types";

export const jevsApi: Api["jevs"] = {
  listByMonth: (input) =>
    request({
      method: "POST",
      path: "/api/jev/list",
      body: input,
      schema: paginatedSchema(JevListItemSchema),
    }),

  get: (id, { includeDeleted = false } = {}) =>
    request({
      method: "GET",
      path: `/api/jev/${id}${includeDeleted ? "?includeDeleted=true" : ""}`,
      schema: JevSchema,
    }),

  create: (input) =>
    request({ method: "POST", path: "/api/jev/new", body: input, schema: JevSchema }),

  update: (id, input) =>
    request({ method: "PUT", path: `/api/jev/${id}`, body: input, schema: JevSchema }),

  delete: async (id, input) => {
    await request({ method: "DELETE", path: `/api/jev/${id}`, body: input });
  },

  getRevision: (id) =>
    request({ method: "GET", path: `/api/jev/revisions/${id}`, schema: JevRevisionSchema }),
};
