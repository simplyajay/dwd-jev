import { JevSchema } from "@dwd-jev/shared";
import { request } from "./http";
import { JevListRowSchema, paginatedSchema } from "./schemas";
import type { Api } from "./types";

export const jevsApi: Api["jevs"] = {
  listByMonth: (input) =>
    request({
      method: "POST",
      path: "/api/jev/list",
      body: input,
      schema: paginatedSchema(JevListRowSchema),
    }),

  get: (id) => request({ method: "GET", path: `/api/jev/${id}`, schema: JevSchema }),

  create: (input) =>
    request({ method: "POST", path: "/api/jev/new", body: input, schema: JevSchema }),

  // The backend has no password-confirmed delete yet.
  delete: async (id) => {
    console.info(`[jevs] delete ${id}: not sent, the backend endpoint isn't ready`);
  },
};
