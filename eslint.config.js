import globals from "globals";
import pluginJs from "@eslint/js";
import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

let rules = {};

rules.libs = [
  {
    languageOptions: {
      globals: globals.browser
    }
  },
  pluginJs.configs.recommended,
  includeIgnoreFile(gitignorePath),
  {
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn"
    },
    ignores: [
      "lib/data.js"
    ]
  }
];


export default rules.libs;
