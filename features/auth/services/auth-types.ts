export type CurrentUser = {
  id: string;
  fullName: string;
  email: string;
  mustChangePassword: boolean;
  roles: string[];
  permissions: { module: string; action: string; scope: "all" | "own" }[];
};
