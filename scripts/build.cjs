const { spawn } = require("child_process");
const path = require("path");

function runNodeScript(scriptPath, args = []) {
  const child = spawn(process.execPath, [scriptPath, ...args], {
    stdio: "inherit",
  });

  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${scriptPath} terminated by signal ${signal}`));
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

  const xmcpExitCode = await runNodeScript(xmcpCli, ["build"]);
  if (xmcpExitCode !== 0) {
    process.exit(xmcpExitCode);
  }

  const nextExitCode = await runNodeScript(nextCli, ["build"]);
  process.exit(nextExitCode);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
