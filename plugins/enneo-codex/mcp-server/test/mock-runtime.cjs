const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { syncBuiltinESMExports } = require("node:module");

const testDir = process.env.ENNEO_TEST_DIR;
if (!testDir) throw new Error("Missing isolated test directory.");
os.homedir = () => testDir;
syncBuiltinESMExports();

const envFile = path.join(testDir, ".enneo", "env");
const replacementFile = path.join(testDir, "replace-after-read");
const readFile = fs.promises.readFile.bind(fs.promises);
fs.promises.readFile = async (file, ...args) => {
  const result = await readFile(file, ...args);
  if (file === envFile && fs.existsSync(replacementFile)) {
    fs.writeFileSync(envFile, fs.readFileSync(replacementFile));
    fs.unlinkSync(replacementFile);
  }
  return result;
};

globalThis.fetch = async (url, init) => {
  const target = new URL(url);
  const request = { instance: target.hostname, token: init.headers.Authorization };
  fs.appendFileSync(path.join(testDir, "requests.jsonl"), JSON.stringify(request) + "\n");
  if (target.pathname !== "/api/mind/profile" || init.method !== "GET") {
    throw new Error("Unexpected auth or renewal request.");
  }
  const statusFile = path.join(testDir, "response-status");
  const status = fs.existsSync(statusFile) ? Number(fs.readFileSync(statusFile, "utf8")) : 200;
  return { ok: status === 200, status, text: async () => JSON.stringify({ id: 1 }) };
};
