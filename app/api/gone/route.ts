// Target of the HTTP 410 rewrites declared in next.config.js (paths listed in config/retired-urls.json).
// Dynamic on purpose: a static route handler would be prerendered, and only retired URLs ever reach it.
export const dynamic = 'force-dynamic';

const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>410 Gone | OpsecForge</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0f0d;color:#d6e2dc;font:16px/1.6 system-ui,sans-serif}
main{max-width:34rem;padding:2rem}
h1{font-size:1.5rem;margin:0 0 .75rem}
a{color:#34d399}
</style>
</head>
<body>
<main>
<h1>410 Gone</h1>
<p>This page was permanently removed and will not return.</p>
<p><a href="/tools">Browse the tools</a> or <a href="/blog">read the current guides</a>.</p>
</main>
</body>
</html>
`;

function gone() {
  return new Response(body, {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex',
      'Cache-Control': 'public, max-age=0, s-maxage=86400',
    },
  });
}

export const GET = gone;
export const HEAD = gone;
