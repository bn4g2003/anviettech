const QUOTE_APPROVER_ROLES = new Set([
  "super admin",
  "admin",
  "trưởng kinh doanh",
]);

export function canApproveQuoteByRole(roles: readonly string[]) {
  return roles.some((role) => QUOTE_APPROVER_ROLES.has(role.trim().toLocaleLowerCase("vi")));
}
