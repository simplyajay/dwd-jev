import { UpdateAccountResultSchema, UserDetailSchema, UserSummarySchema } from "@dwd-jev/shared";
import { z } from "zod";
import { request } from "./http";
import type { Api } from "./types";

export const usersApi: Api["users"] = {
  // Not paginated yet; return its `items` here once it is.
  list: () => request({ method: "GET", path: "/api/users", schema: z.array(UserSummarySchema) }),

  get: (id) => request({ method: "GET", path: `/api/users/${id}`, schema: UserDetailSchema }),

  listPending: () =>
    request({
      method: "GET",
      path: "/api/admin/users/pending",
      schema: z.array(UserSummarySchema),
    }),

  approve: async (id, input) => {
    await request({ method: "POST", path: `/api/admin/users/${id}/approve`, body: input });
  },

  // The backend deletes the rejected account.
  reject: async (id, input) => {
    await request({ method: "POST", path: `/api/admin/users/${id}/reject`, body: input });
  },

  setStatus: async (id, input) => {
    await request({ method: "PATCH", path: `/api/admin/users/${id}/status`, body: input });
  },

  setRole: async (id, input) => {
    await request({ method: "PATCH", path: `/api/admin/users/${id}/role`, body: input });
  },

  updateProfile: (input) =>
    request({
      method: "PUT",
      path: "/api/users/me/profile",
      body: input,
      schema: UserDetailSchema,
    }),

  updateAccount: (input) =>
    request({
      method: "PUT",
      path: "/api/users/me/account",
      body: input,
      schema: UpdateAccountResultSchema,
    }),
};
