import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    base: "/instawinner-magic/",
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
