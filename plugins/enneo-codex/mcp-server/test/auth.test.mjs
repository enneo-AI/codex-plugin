import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir, stat, copyFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const serverDir = fileURLToPath(new URL("../", import.meta.url));
const token = (payload = {}) => `e30.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.fake-signature`;
const envText = ({ instance = "first.enneo.ai", key = "fake-first", expiresAt } = {}) =>
  `export ENNEO_INSTANCE="${instance}"\nexport ENNEO_TOKEN="${key}"\n` +
  (expiresAt === undefined ? "" : `export ENNEO_TOKEN_EXPIRES_AT="${expiresAt}"\n`);

async function connect({ t, entrypoint, initialEnv }) {
  const directory = await mkdtemp(join(tmpdir(), "enneo-mcp-auth-"));
  const envFile = join(directory, ".enneo", "env");
  await mkdir(join(directory, ".enneo"), { mode: 0o700 });
  if (initialEnv !== undefined) await writeFile(envFile, initialEnv, { mode: 0o600 });
  const client = new Client({ name: "auth-regression", version: "1.0.0" });
  t.after(async () => {
    await client.close();
    await rm(directory, { recursive: true, force: true });
  });
  const modulePath = entrypoint === "bundle/index.js" ? join(directory, "bundle.mjs") : join(serverDir, entrypoint);
  if (entrypoint === "bundle/index.js") await copyFile(join(serverDir, entrypoint), modulePath);
  await client.connect(new StdioClientTransport({
    command: process.execPath,
    args: ["--require", join(serverDir, "test/mock-runtime.cjs"), modulePath],
    env: { ENNEO_TEST_DIR: directory },
    stderr: "pipe",
  }));
  return {
    client, directory, envFile,
    call: (name, args = {}) => client.callTool({ name, arguments: args }),
    requests: async () => {
      try {
        return (await readFile(join(directory, "requests.jsonl"), "utf8")).trim().split("\n").map(JSON.parse);
      } catch (error) {
        if (error.code === "ENOENT") return [];
        throw error;
      }
    },
  };
}

for (const entrypoint of ["dist/index.js", "bundle/index.js"]) {
  test(`${entrypoint}: missing credentials return setup without HTTP`, async (t) => {
    const h = await connect({ t, entrypoint });
    assert.equal((await h.client.listTools()).tools.length, 5);
    assert.equal((await h.call("enneo_profile_me")).isError, true);
    await h.call("enneo_configure", { instance: "first.enneo.ai" });
    const result = await h.call("enneo_profile_me");
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /local editor/);
    assert.deepEqual(await h.requests(), []);
  });

  test(`${entrypoint}: repeated calls reuse locally edited keys without renewal`, async (t) => {
    const initialEnv = envText({ instance: " HTTPS://First.Enneo.AI/ ", expiresAt: 1 });
    const h = await connect({ t, entrypoint, initialEnv });
    for (let i = 0; i < 2; i++) assert.equal((await h.call("enneo_profile_me")).isError, undefined);
    assert.equal(await readFile(h.envFile, "utf8"), initialEnv);
    await writeFile(h.envFile, envText({ key: "fake-replacement" }));
    await h.call("enneo_profile_me");
    assert.deepEqual(await h.requests(), [
      { instance: "first.enneo.ai", token: "Bearer fake-first" },
      { instance: "first.enneo.ai", token: "Bearer fake-first" },
      { instance: "first.enneo.ai", token: "Bearer fake-replacement" },
    ]);
  });

  test(`${entrypoint}: each request uses one instance/key snapshot`, async (t) => {
    const h = await connect({ t, entrypoint, initialEnv: envText() });
    await writeFile(join(h.directory, "replace-after-read"), envText({ instance: "second.enneo.ai", key: "fake-second" }));
    await h.call("enneo_profile_me");
    await h.call("enneo_profile_me");
    assert.deepEqual(await h.requests(), [
      { instance: "first.enneo.ai", token: "Bearer fake-first" },
      { instance: "second.enneo.ai", token: "Bearer fake-second" },
    ]);
  });

  test(`${entrypoint}: replacing a key clears old expiry unless the new key specifies one`, async (t) => {
    const h = await connect({ t, entrypoint, initialEnv: envText({ expiresAt: 123 }) });
    const key = token();
    assert.equal((await h.call("enneo_store_token", { token: key, instance: " HTTP://Second.Enneo.AI/ " })).isError, undefined);
    assert.equal(await readFile(h.envFile, "utf8"), envText({ instance: "second.enneo.ai", key }));
    await h.call("enneo_store_token", { token: token({ exp: 456 }) });
    assert.match(await readFile(h.envFile, "utf8"), /ENNEO_TOKEN_EXPIRES_AT="456"/);
    await h.call("enneo_store_token", { token: token(), expiresAt: 789 });
    assert.match(await readFile(h.envFile, "utf8"), /ENNEO_TOKEN_EXPIRES_AT="789"/);
    assert.equal((await stat(h.envFile)).mode & 0o777, 0o600);
  });

  test(`${entrypoint}: same instance keeps its key; switching and reset clear it`, async (t) => {
    const initialEnv = envText({ instance: "HTTPS://First.Enneo.AI/", expiresAt: 123 });
    const h = await connect({ t, entrypoint, initialEnv });
    assert.equal((await h.call("enneo_configure")).isError, true);
    assert.equal(await readFile(h.envFile, "utf8"), initialEnv);
    await h.call("enneo_configure", { instance: " http://FIRST.enneo.ai/ " });
    await h.call("enneo_profile_me");
    await h.call("enneo_configure", { instance: "second.enneo.ai" });
    assert.equal(await readFile(h.envFile, "utf8"), 'export ENNEO_INSTANCE="second.enneo.ai"\n');
    assert.equal((await h.call("enneo_profile_me")).isError, true);
    await writeFile(h.envFile, envText({ instance: "second.enneo.ai", key: "fake-second", expiresAt: 456 }));
    await h.call("enneo_configure", { instance: "second.enneo.ai", reset: true });
    assert.equal(await readFile(h.envFile, "utf8"), 'export ENNEO_INSTANCE="second.enneo.ai"\n');
    assert.equal((await h.call("enneo_profile_me")).isError, true);
    assert.deepEqual(await h.requests(), [{ instance: "first.enneo.ai", token: "Bearer fake-first" }]);
  });

  test(`${entrypoint}: configure repairs invalid or missing old instance without carrying its key`, async (t) => {
    const h = await connect({ t, entrypoint, initialEnv: envText({ instance: "invalid/path" }) });
    assert.equal((await h.call("enneo_profile_me")).isError, true);
    for (const instance of ["invalid/path", ""]) {
      await writeFile(h.envFile, envText({ instance }));
      assert.equal((await h.call("enneo_configure", { instance: "first.enneo.ai" })).isError, undefined);
      assert.equal((await h.call("enneo_profile_me")).isError, true);
    }
    assert.deepEqual(await h.requests(), []);
  });

  test(`${entrypoint}: unauthorized responses do not retry, renew or discard the key`, async (t) => {
    const initialEnv = envText();
    const h = await connect({ t, entrypoint, initialEnv });
    for (const status of [401, 403]) {
      await writeFile(join(h.directory, "response-status"), String(status));
      const result = await h.call("enneo_profile_me");
      assert.equal(result.isError, true);
      assert.match(result.content[0].text, new RegExp(`-> ${status}:`));
    }
    assert.equal((await h.requests()).length, 2);
    assert.equal(await readFile(h.envFile, "utf8"), initialEnv);
  });

  test(`${entrypoint}: concurrent writes keep a complete instance/key pair`, async (t) => {
    const h = await connect({ t, entrypoint, initialEnv: envText() });
    const alternatives = Array.from({ length: 12 }, (_, i) => ({ instance: `instance-${i}.enneo.ai`, key: token({ userId: i }) }));
    const results = await Promise.all(alternatives.map(({ instance, key }) => h.call("enneo_store_token", { instance, token: key })));
    assert.ok(results.every((result) => !result.isError));
    const saved = await readFile(h.envFile, "utf8");
    assert.ok(alternatives.some((value) => saved === envText(value)));
    assert.deepEqual(await readdir(join(h.directory, ".enneo")), ["env"]);
  });
}
