import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["dist", "public/mockServiceWorker.js", "eslint.config.js"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      // Type-aware rules catch what syntax alone can't: un-awaited promises,
      // `any` leaking through, conditions that are always true.
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Generated shadcn/ui components export style variants next to components,
    // so fast-refresh purity does not apply to them; and as vendored code
    // they are kept as generated rather than held to the type-aware rules.
    files: ["src/components/ui/**/*.tsx"],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
])
