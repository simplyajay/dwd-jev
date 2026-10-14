import type {
  CreateUserInput,
  JevByMonthInput,
  JevListItem,
  LoginInput,
  PaginatedResult,
  SafeUserType,
} from "@dwd-jev/shared";
import type { z } from "zod";
import type { AuthSessionSchema } from "./schemas";

/** What login and refresh return. */
export type AuthSession = z.output<typeof AuthSessionSchema>;

/**
 * Everything the UI needs from the backend. Screens depend on this interface
 * only, never on how a call is made.
 */
export interface Api {
  auth: {
    login(input: LoginInput): Promise<AuthSession>;
    /** Creates the account. It usually starts as `awaiting_approval`. */
    register(input: CreateUserInput): Promise<SafeUserType>;
    refresh(refreshToken: string): Promise<AuthSession>;
    logout(refreshToken: string): Promise<void>;
  };
  jevs: {
    listByMonth(input: JevByMonthInput): Promise<PaginatedResult<JevListItem>>;
  };
}
