import re

with open("../../content/blog/20260321-938dbbbc.md", "r") as f:
    text = f.read()

# Fix buttons
text = text.replace('text-slate-950', '!text-slate-950 !no-underline')
text = text.replace('https://opsecforge.com/newsletter', '/')

# Fix H2s
text = text.replace('<h2 class="m-0', '<h2 class="!mt-0 mb-0')

with open("../../content/blog/20260321-938dbbbc.md", "w") as f:
    f.write(text)
