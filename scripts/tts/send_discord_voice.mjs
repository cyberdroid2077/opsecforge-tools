import { sendVoiceMessageDiscord } from "/home/dingw/openclaw/dist/extensions/discord/runtime-api.js";

const [target, audioPath, accountId = "mira"] = process.argv.slice(2);

if (!target || !audioPath) {
  console.error("usage: node send_discord_voice.mjs <target> <audioPath> [accountId]");
  process.exit(2);
}

async function loadConfig() {
  try {
    const configPath = "/home/dingw/.openclaw/openclaw.json";
    const { readFile } = await import("fs/promises");
    const configData = await readFile(configPath, "utf-8");
    return JSON.parse(configData);
  } catch (err) {
    console.error("Warning: Could not load config:", err.message);
    return undefined;
  }
}

try {
  const cfg = await loadConfig();
  const result = await sendVoiceMessageDiscord(target, audioPath, { accountId, cfg });
  console.log(JSON.stringify(result));
} catch (err) {
  console.error(err?.stack || String(err));
  process.exit(1);
}
