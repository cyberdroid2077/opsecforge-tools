import json, re

with open("../opsecforge_tools_catalog.json", "r") as f:
    catalog = json.load(f)

for tool in catalog:
    for key in ['tool_spotlight_template', 'tip_template']:
        if key in tool:
            text = tool[key]
            text = re.sub(r'<a href="([^"]+)" class="font-medium underline text-blue-800">([^<]+)</a>', r'<a href="\2" class="font-medium underline text-blue-800">\1</a>', text)
            tool[key] = text

with open("../opsecforge_tools_catalog.json", "w") as f:
    json.dump(catalog, f, indent=2)
