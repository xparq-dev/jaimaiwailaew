import { spawn } from "node:child_process";
import { once } from "node:events";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const host = "127.0.0.1";
const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseUrl = `http://${host}:${port}`;
const workspace = process.cwd();
const nextCli = join(workspace, "node_modules", "next", "dist", "bin", "next");
const playwrightCli = join(
  workspace,
  "node_modules",
  "@playwright",
  "test",
  "cli.js",
);
const childEnvironment = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_E2E_AUTH_MODE: "1",
  NEXT_PUBLIC_E2E_CLOUD_MODE: "1",
};

async function waitForServer(server) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(
        `Next.js exited before becoming ready (code ${server.exitCode}).`,
      );
    }

    try {
      const response = await fetch(baseUrl, {
        cache: "no-store",
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return;
    } catch {
      // The server is still starting; retry within the bounded readiness window.
    }

    await delay(250);
  }

  throw new Error(
    `Next.js did not become ready at ${baseUrl} within 60 seconds.`,
  );
}

async function stopServer(server) {
  if (server.exitCode !== null || server.killed) return;

  server.kill("SIGTERM");
  const exited = once(server, "exit").then(() => true);
  const timedOut = delay(3_000).then(() => false);

  if (!(await Promise.race([exited, timedOut])) && server.exitCode === null) {
    server.kill("SIGKILL");
  }
}

const build = spawn(process.execPath, [nextCli, "build"], {
  cwd: workspace,
  env: childEnvironment,
  stdio: "inherit",
  windowsHide: true,
});
const [buildCode] = await once(build, "exit");

if (buildCode !== 0) {
  process.exitCode = typeof buildCode === "number" ? buildCode : 1;
} else {
  const server = spawn(
    process.execPath,
    [nextCli, "start", "--hostname", host, "--port", port],
    {
      cwd: workspace,
      env: childEnvironment,
      stdio: "inherit",
      windowsHide: true,
    },
  );

  let exitCode = 1;

  try {
    await waitForServer(server);

    const tests = spawn(
      process.execPath,
      [playwrightCli, "test", ...process.argv.slice(2)],
      {
        cwd: workspace,
        env: {
          ...childEnvironment,
          PLAYWRIGHT_BASE_URL: baseUrl,
        },
        stdio: "inherit",
        windowsHide: true,
      },
    );

    const [code] = await once(tests, "exit");
    exitCode = typeof code === "number" ? code : 1;
  } finally {
    await stopServer(server);
  }

  process.exitCode = exitCode;
}
