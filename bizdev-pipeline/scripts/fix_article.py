import re

with open("../../content/blog/ai-native-api-gateway-security-for-enterprise-2026.md", "r") as f:
    text = f.read()

ugly_html = r'<div class="my-8 border-l-4 border-indigo-500 bg-slate-800/50 p-5 rounded-r-lg shadow-md">.*?</div>'

beautiful_md = "> **🛡️ Proactive API Defense**  \n> Don't wait for a breach to find your API misconfigurations. Use the [OpSecForge API Scanner](https://opsecforge.tools/api-scanner) to automatically audit your endpoints for CORS, JWT, and authentication flaws in seconds."

text = re.sub(ugly_html, beautiful_md, text, flags=re.DOTALL)

with open("../../content/blog/ai-native-api-gateway-security-for-enterprise-2026.md", "w") as f:
    f.write(text)
