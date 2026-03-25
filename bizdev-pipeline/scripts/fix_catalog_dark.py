import json
import re

with open("../opsecforge_tools_catalog.json", "r") as f:
    catalog = json.load(f)

# The new dark-mode friendly template
# Using typical Tailwind dark mode classes that degrade gracefully or just hardcode for dark theme since the site is dark.
# Let's use generic dark theme classes.
html_template = """<div class="my-8 border-l-4 border-indigo-500 bg-slate-800/50 p-5 rounded-r-lg shadow-md">
  <div class="flex items-center gap-2 mb-2">
    <strong class="font-semibold text-indigo-300 text-lg tracking-wide">{title}</strong>
  </div>
  <p class="text-slate-300 leading-relaxed m-0">{body}</p>
</div>"""

for tool in catalog:
    for key in ['tool_spotlight_template', 'tip_template']:
        if key in tool:
            text = tool[key]
            
            # Extract title and body from the ugly HTML
            # Old format: 
            # <div class="...">\n  <strong class="...">Title</strong><br/>\n  <span class="...">Body</span>\n</div>
            
            title_match = re.search(r'<strong[^>]*>(.*?)</strong>', text)
            body_match = re.search(r'<span[^>]*>(.*?)</span>', text)
            
            if title_match and body_match:
                title = title_match.group(1)
                body = body_match.group(1)
                
                # Fix the link styling inside the body to be dark-mode friendly
                body = re.sub(r'class="[^"]+"', 'class="font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"', body)
                
                tool[key] = html_template.format(title=title, body=body)

with open("../opsecforge_tools_catalog.json", "w") as f:
    json.dump(catalog, f, indent=2)
