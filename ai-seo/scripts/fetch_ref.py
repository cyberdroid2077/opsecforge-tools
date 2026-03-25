import requests
from bs4 import BeautifulSoup
import sys

url = "https://opsecforge-tools-a10hy3hdg-cyberdroid2077s-projects.vercel.app/blog/how-to-safely-share-env-files"
resp = requests.get(url)
soup = BeautifulSoup(resp.text, 'html.parser')

# Find all blockquotes or divs that might be callouts
for div in soup.find_all('div', class_=True):
    classes = div.get('class', [])
    if 'border-l-4' in classes or 'bg-' in classes or 'p-4' in classes:
        print(f"--- FOUND DIV ---")
        print(div.prettify())

for bq in soup.find_all('blockquote'):
    print(f"--- FOUND BLOCKQUOTE ---")
    print(bq.prettify())

