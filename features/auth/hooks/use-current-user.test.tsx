import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", () => ({
  apiFetch: vi.fn(),
}));

import {
  setCurrentUserCache,
  useCurrentUser,
} from "./use-current-user";

function QuotesCreatePermission() {
  const { canCreate } = useCurrentUser();
  return <span>{canCreate("quotes") ? "allowed" : "denied"}</span>;
}

afterEach(() => {
  setCurrentUserCache(null);
});

describe("useCurrentUser", () => {
  it("does not use the client user cache in server-rendered markup", () => {
    setCurrentUserCache({
      id: "user-1",
      fullName: "Quản trị viên",
      email: "admin@example.com",
      mustChangePassword: false,
      roles: ["admin"],
      permissions: [],
    });

    expect(renderToStaticMarkup(<QuotesCreatePermission />)).toBe(
      "<span>denied</span>",
    );
  });
});
