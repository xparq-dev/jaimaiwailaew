import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

if (!existsSync(".git")) {
  process.stdout.write(
    "Skipping Husky setup: this directory is not a Git working tree.\n",
  );
  process.exit(0);
}

const executable = process.platform === "win32" ? "npm.cmd" : "npm";
execFileSync(executable, ["exec", "--", "husky"], { stdio: "inherit" });
