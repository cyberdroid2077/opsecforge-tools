import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Phase 2: static blog content (hand-authored, natural-language apostrophes/quotes)
    "app/blog/**",
    "app/case-studies/**",
    // Known pre-existing issues tracked for later cleanup:
    "app/tools/jwt-encoder/page.tsx",   // Web Crypto API type mismatch
    "components/TextDiffTool.tsx",      // diff library type issues
    "next.config.js",                    // require() for next-pwa (no ESM equivalent)
    // Scripts (not part of the Next.js app)
    "scripts/**",
  ]),
]);

export default eslintConfig;
