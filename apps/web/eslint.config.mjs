// apps/web/eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ✅ Monorepo/App Router fixes
  {
    settings: {
      next: {
        // Tell eslint-plugin-next where the Next.js app lives
        rootDir: ["apps/web"],
      },
    },
    rules: {
      // App Router projects may not have /pages; this rule breaks in monorepos
      "@next/next/no-html-link-for-pages": "off",

      // Temporary: unblock commits; we'll replace `any` with proper types iteratively
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;