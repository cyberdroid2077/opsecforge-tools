---
title: "SSRF Prevention for APIs: Allowlist the Host, Check the IP You Connect To"
date: "2026-03-22"
updated: "2026-10-23"
description: "How to stop server-side request forgery in URL-fetching API features: host allowlists, IP checks at connection time, redirect handling, and cloud metadata hardening, with Python and Node code tested against local servers."
author: "OpsecForge Security Team"
category: "API Security"
source_reviewed: "2026-10-23"
primary_source: "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html"
---

# SSRF Prevention for APIs: Allowlist the Host, Check the IP You Connect To

**Short answer.** If your API fetches a URL that a client supplied, allowlist the destination hosts, then check the IP address of the connection you actually open. Do not resolve the name, check it, and hand the URL to an HTTP client that resolves it again. Either refuse redirects or re-run every check on each hop. Cloud metadata hardening and egress rules reduce the damage when a check fails; they do not replace the checks.

[OWASP API7:2023](https://owasp.org/API-Security/editions/2023/en/0xa7-server-side-request-forgery/) names webhooks, file fetching from URLs, custom SSO and URL previews as the features that make SSRF common. Its prevention list asks for allowlists of origins, schemes and ports, disabled redirects, and a well-tested URL parser. It also warns that the risk cannot always be completely eliminated.

## Why validate-then-fetch breaks

Three gaps recur in code that validates a URL and then calls a client library:

- **A second DNS lookup.** The validator resolves `hooks.example.com` and sees a public address. The HTTP client resolves it again and gets `127.0.0.1`. The [OWASP SSRF cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) says an unchecked lookup between validation and connection can bypass the checks, and recommends connecting to the validated IP while keeping the original hostname for the `Host` header, TLS SNI and certificate verification.
- **Redirects.** A public host answers `302 Location: http://127.0.0.1/...`. Python `requests` and `fetch` follow it by default.
- **Address spellings.** On the Linux test machine below, `2130706433`, `0177.0.0.1`, `0x7f.0.0.1` and `127.1` all resolved to `127.0.0.1`. IPv6 adds `::1`, `::ffff:127.0.0.1` and unique-local `fd00::/8`. A string denylist misses some of these; checking the address the resolver returned does not.

## A guard that checks at connection time (Python)

The code below overrides how `requests` opens sockets. It resolves once, requires every returned address to be globally routable (Python's `ipaddress` bases `is_global` on the IANA special-purpose registries; [Python 3.13 changed some results](https://docs.python.org/3/library/ipaddress.html#ipaddress.IPv4Address.is_global), so test on your version), and connects to one of those addresses. The URL keeps its hostname, so `Host`, SNI and certificate verification are unchanged. Redirects are refused unless you allow a number of hops, and each hop is checked again.

```python
import ipaddress, socket
from urllib.parse import urljoin, urlsplit

import requests
from requests.adapters import HTTPAdapter
from urllib3.connection import HTTPConnection, HTTPSConnection
from urllib3.connectionpool import HTTPConnectionPool, HTTPSConnectionPool
from urllib3.util import parse_url
from urllib3.util.connection import create_connection


class Blocked(Exception):
    pass


def ip_allowed(ip: str) -> bool:
    """Positive test: only globally routable unicast addresses pass."""
    addr = ipaddress.ip_address(ip.split("%")[0])
    if addr.version == 6 and addr.ipv4_mapped:
        addr = addr.ipv4_mapped          # ::ffff:127.0.0.1 is 127.0.0.1
    return addr.is_global and not addr.is_multicast


def guarded_connect(address, timeout, source_address=None, socket_options=None):
    host, port = address
    infos = socket.getaddrinfo(host.strip("[]"), port, type=socket.SOCK_STREAM)
    ips = list(dict.fromkeys(i[4][0] for i in infos))
    for ip in ips:                        # one lookup; every answer must pass
        if not ip_allowed(ip):
            raise Blocked(f"{host} resolved to disallowed address {ip}")
    last = None
    for ip in ips:                        # connect to the IP we just checked
        try:
            return create_connection((ip, port), timeout, source_address, socket_options)
        except OSError as exc:
            last = exc
    raise last


class _Plain(HTTPConnection):
    def _new_conn(self):
        return guarded_connect((self._dns_host, self.port), self.timeout,
                               self.source_address, self.socket_options)


class _Tls(HTTPSConnection):              # URL keeps the hostname, so the
    def _new_conn(self):                  # Host header, SNI and certificate
        return guarded_connect((self._dns_host, self.port), self.timeout,
                               self.source_address, self.socket_options)


class _PlainPool(HTTPConnectionPool):
    ConnectionCls = _Plain


class _TlsPool(HTTPSConnectionPool):
    ConnectionCls = _Tls


class GuardedAdapter(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        super().init_poolmanager(*args, **kwargs)
        self.poolmanager.pool_classes_by_scheme = {"http": _PlainPool, "https": _TlsPool}


def check_url(url, allowed_hosts, ports=(80, 443)):
    u = urlsplit(url)
    host = (u.hostname or "").lower()
    if u.scheme not in ("http", "https") or u.username or u.password:
        raise Blocked("scheme or userinfo not allowed")
    if (parse_url(url).host or "").strip("[]").lower() != host:
        raise Blocked("URL parsers disagree about the host")
    if allowed_hosts is not None and host not in allowed_hosts:
        raise Blocked(f"host {host!r} is not on the allowlist")
    if u.port is not None and u.port not in ports:
        raise Blocked(f"port {u.port} not allowed")


def safe_get(url, allowed_hosts, max_redirects=0, ports=(80, 443), **kw):
    s = requests.Session()
    s.trust_env = False                   # ignore proxy variables
    s.mount("http://", GuardedAdapter())
    s.mount("https://", GuardedAdapter())
    for _ in range(max_redirects + 1):
        check_url(url, allowed_hosts, ports)
        r = s.get(url, allow_redirects=False, timeout=(3, 5), stream=True, **kw)
        if not r.is_redirect:
            return r
        url = urljoin(url, r.headers["Location"])   # re-validated next loop
        r.close()
    raise Blocked("redirect limit reached")
```

Allowlist mode (`allowed_hosts={"hooks.example.com"}`) is the right default when you know the destinations. Passing `None` allows any public host, which is the case OWASP describes as having no allowlist; there the address check is your main control, so keep redirects off and set size and time limits.

## The same idea in Node

Node's `net.connect` accepts a `lookup` function, and `http.Agent` passes it through. The hook runs inside the connection, so the checked address is the connected address. Node skips `lookup` when the host is already an IP literal, so literals need an explicit check.

```javascript
import dns from 'node:dns';
import http from 'node:http';
import net from 'node:net';

const special = new net.BlockList();           // IANA special-use ranges
for (const [a, p] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['224.0.0.0', 4], ['240.0.0.0', 4]]) special.addSubnet(a, p, 'ipv4');
for (const [a, p] of [['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8]])
  special.addSubnet(a, p, 'ipv6');

// BlockList also applies the IPv4 rules to IPv4-mapped IPv6 (::ffff:7f00:1)
export const guard = { ipAllowed: (ip) => !special.check(ip, net.isIPv6(ip) ? 'ipv6' : 'ipv4') };

// Runs inside net.connect, so the address checked is the address connected to.
const lookup = (host, options, cb) =>
  dns.lookup(host, options, (err, address, family) => {
    if (err) return cb(err);
    const list = Array.isArray(address) ? address : [{ address }];   // options.all
    const bad = list.find((a) => !guard.ipAllowed(a.address));
    cb(bad ? new Error(`blocked: ${host} resolved to ${bad.address}`) : null, address, family);
  });
const agent = new http.Agent({ lookup });      // use https.Agent the same way

export function safeGet(url, allowedHosts) {
  const u = new URL(url);                      // WHATWG parser: 2130706433 -> 127.0.0.1
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (u.protocol !== 'http:' || u.username || u.password) throw new Error('blocked: scheme or userinfo');
  if (allowedHosts && !allowedHosts.has(host)) throw new Error(`blocked: ${host} not on allowlist`);
  if (net.isIP(host) && !guard.ipAllowed(host)) throw new Error(`blocked: literal ${host}`); // lookup is skipped for IP literals
  return new Promise((resolve, reject) =>      // http.get never follows redirects
    http.get(u, { agent, timeout: 5000 }, resolve).on('error', reject));
}
```

## What the local tests showed

The test scripts live in a temporary directory and are not published here. They start one server on `127.0.0.1` (the "internal" service) and one on `127.0.0.2` (standing in for the internet), replace DNS with a table that changes its answer between lookups, and count requests that reach the internal server. Python 3.12 with requests 2.31 and urllib3 2.0.7 passed 26 of 26 checks; Node 22 passed 18 of 18. Excerpts:

```text
naive validate-then-fetch: body='INTERNAL-SECRET', lookups=2, internal hits=1
guarded: body='PUBLIC-OK', lookups=1, internal hits=0
naive requests.get follows redirect: body='INTERNAL-SECRET', internal hits=1
per-hop check, allowlist mode: host '127.0.0.1' is not on the allowlist; internal hits=0
https to pinned IP: 200 'TLS-OK', server saw SNI=['tls.test']
2130706433 resolved to disallowed address 127.0.0.1
```

Python and Node also blocked `localhost`, `0.0.0.0`, `[::1]`, `[::ffff:127.0.0.1]`, `169.254.169.254`, `10.0.0.5`, `[fd00::1]` and `100.64.0.1`. These tests use loopback addresses as stand-ins, so they show the logic, not production DNS behaviour. They do not cover proxies or your cloud's resolver.

## Cloud metadata services

Metadata endpoints are the classic SSRF target, which is why `169.254.169.254` and AWS's IPv6 address `fd00:ec2::254` must fail the address check. Each provider also adds its own request requirements:

- **AWS.** [IMDSv2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-metadata-v2-how-it-works.html) needs a `PUT` to get a session token, then that token on later requests. With tokens set to required, requests without a valid token receive 401. `PUT` requests carrying `X-Forwarded-For` are rejected, and the default response hop limit is 1. Setting this per instance is covered in [Configure the Instance Metadata Service options](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html).
- **Google Cloud.** The [metadata server](https://cloud.google.com/compute/docs/metadata/querying-metadata) denies requests that lack `Metadata-Flavor: Google`.
- **Azure.** The [Instance Metadata Service](https://learn.microsoft.com/en-us/azure/virtual-machines/instance-metadata-service) requires `Metadata: true` and rejects requests containing `X-Forwarded-For`.

These header and method rules stop a fetcher that cannot choose its own headers or verbs. A feature that lets callers set arbitrary headers or methods gets less from them (this is our inference, not a statement in the provider documents). OWASP calls IMDSv2 defence in depth that mitigates some SSRF cases.

## Checklist

- Allowlist hosts, schemes and ports; build the request yourself instead of passing the client's URL along.
- Check resolved addresses at connect time and refuse mixed answers.
- Disable redirects, or validate every hop.
- Ignore proxy environment variables for this client, or enforce the policy in the proxy.
- Limit response size and time, and do not return raw upstream responses.
- Restrict egress at the network layer and require IMDSv2 (or the equivalent) on cloud hosts.

Sources: [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html), [OWASP API7:2023](https://owasp.org/API-Security/editions/2023/en/0xa7-server-side-request-forgery/), the AWS, Google Cloud and Azure pages linked above, and the [Node.js `net.connect` documentation](https://nodejs.org/api/net.html) for the `lookup` option.
