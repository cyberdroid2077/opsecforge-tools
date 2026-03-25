import discord, subprocess, re, os

intents = discord.Intents.default(); intents.message_content = True
bot = discord.Client(intents=intents)

# 环境配置
ALLOWED_CHANNEL_ID = int(os.getenv('DISCORD_CHANNEL_ID', 0))
ALLOWED_USER_ID = int(os.getenv('DISCORD_USER_ID', 0))

@bot.event
async def on_message(message):
    if message.author == bot.user: return
    if message.channel.id != ALLOWED_CHANNEL_ID or message.author.id != ALLOWED_USER_ID: return

    # Modified regex: rework 1 "notes"
    m = re.match(r'^(approve|reject|rework)(?:\s+(\d+))?(?:\s+"(.*?)")?$', message.content.strip())
    if m:
        action, sid, notes = m.groups()
        args = ["/usr/bin/python3", "/home/dingw/opsecforge-tools/ai-seo/scripts/run_approval_bridge.py", action]
        if sid: args.append(sid)
        if notes: args.append(notes)
        
        proc = subprocess.run(args, capture_output=True, text=True)
        resp = proc.stdout.strip() if proc.stdout.strip() else (proc.stderr.strip() if proc.stderr.strip() else "Unknown error")
        
        if proc.returncode == 0 and "Success" in resp:
            await message.add_reaction("✅")
            await message.reply(f"Success: {resp}")
        else:
            await message.add_reaction("❌")
            await message.reply(f"Failed: {resp}")

bot.run(os.getenv('DISCORD_BOT_TOKEN'))
