import type { User } from "@/types/db.types";

export async function getSessionUser(): Promise<User> {
  const response = await fetch(`/api/user`);
  const user = (await response.json()) as User;
  return user;
}
