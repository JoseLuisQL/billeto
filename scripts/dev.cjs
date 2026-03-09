const { spawn } = require("child_process");
const path = require("path");

function runNodeScript(scriptPath, args = [], options = {}) {
  return spawn(process.execPath, [scriptPath, ...args], {
    stdio: "inherit",
    ...options,
  });
}

function waitForExit(child, label) {
  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${label} terminated by signal ${signal}`));
        return;
      }

      resolve(code ?? 0);
    });
  });
}

async function main() {
  const cwd = process.cwd();
  const xmcpCli = path.join(cwd, "node_modules", "xmcp", "dist", "cli.js");
  const nextCli = path.join(cwd, "node_modules", "next", "dist", "bin", "next");

  const build = runNodeScript(xmcpCli, ["build"]);
  const buildExitCode = await waitForExit(build, "xmcp build");
  if (buildExitCode !== 0) {
    process.exit(buildExitCode);
  }

  const xmcpDev = runNodeScript(xmcpCli, ["dev"]);
  const nextDev = runNodeScript(nextCli, ["dev"]);

  const children = [xmcpDev, nextDev];
  let settled = false;

  const terminateChildren = () => {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGTERM");
      }
    }
  };

  process.on("SIGINT", () => {
    terminateChildren();
  });

  process.on("SIGTERM", () => {
    terminateChildren();
  });

  for (const [index, child] of children.entries()) {
    child.on("exit", (code, signal) => {
      if (settled) return;
      settled = true;
      terminateChildren();

      if (signal) {
        process.exit(1);
        return;
      }

      process.exit(code ?? (index === 0 ? 1 : 0));
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      console.error(error);
      terminateChildren();
      process.exit(1);
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
