import json
import re

# 1. Fix the catalog
with open("../opsecforge_tools_catalog.json", "r") as f:
    catalog = json.load(f)

for tool in catalog:
    for key in ['tool_spotlight_template', 'tip_template']:
        if key in tool:
            text = tool[key]
            # Fix button text color (add !important to override global)
            text = text.replace('text-slate-950', '!text-slate-950 !no-underline')
            # Fix the 404 link
            text = text.replace('https://opsecforge.com/newsletter', '/')
            tool[key] = text

with open("../opsecforge_tools_catalog.json", "w") as f:
    json.dump(catalog, f, indent=2)

# 2. Fix the prompt UI kit
with open("../prompts/enhancer.txt", "r") as f:
    prompt = f.read()

# Fix the H2 alignment by forcing margin-top to 0
prompt = prompt.replace('<h2 class="m-0 text-2xl', '<h2 class="!mt-0 mb-0 text-2xl')

with open("../prompts/enhancer.txt", "w") as f:
    f.write(prompt)

