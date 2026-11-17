import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { NAV_ITEMS } from "@/lib/nav";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

  it("matches a page for / instead of falling back to not found", () => {
    expect(router.matchRoutes("/").at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("navigation has exactly the three main menu items, Overview first", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(["Áttekintés", "Számlák", "Havi elszámolás"]);
    expect(NAV_ITEMS[0].to).toBe("/");
  });

  it.each(NAV_ITEMS.map((i) => i.to))("menu target %s resolves to a page", (path) => {
    expect(router.matchRoutes(path).at(-1)?.routeId).toBe(path);
  });
});
