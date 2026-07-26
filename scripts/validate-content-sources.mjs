import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const BLOG_PREFIX = "content/blog/";
const CVE_PATTERN = /\bCVE-\d{4}-\d{4,}\b/gi;
const CONFIRMED_EXPLOIT_PATTERN =
  /\b(?:Exploitation:\s*Confirmed|confirmed exploitation|actively exploited|exploited in the wild)\b/i;

function changedBlogFiles() {
  try {
    const committed = execFileSync(
      "git",
      ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"],
      { encoding: "utf8" },
    );
    const working = execFileSync(
      "git",
      ["diff", "--name-only", "HEAD", "--", BLOG_PREFIX],
      { encoding: "utf8" },
    );

    return [...new Set(`${committed}\n${working}`.split(/\r?\n/))]
      .filter((file) => file.startsWith(BLOG_PREFIX) && file.endsWith(".md"));
  } catch {
    return [];
  }
}

const explicitFiles = process.argv.slice(2);
const files = explicitFiles.length > 0 ? explicitFiles : changedBlogFiles();
const failures = [];
const highRiskClaimPattern =
  /(?:\$\s?\d[\d,.]*|\b\d+(?:\.\d+)?%\b|\b\d[\d,.]*\s+(?:million|billion)\b|\b(?:study|survey|research|report)\s+(?:found|shows?|reveals?|reports?)\b|\b(?:breach|incident)\b.{0,100}\b(?:cost|fine|records?|customers?|users?|sessions?)\b)/i;
const unsupportedProductClaims = [
  {
    pattern:
      /(?:our\s+)?JWT Decoder[\s\S]{0,220}\b(?<!not )(?:validates?|verif(?:y|ies)|checks?)\b[\s\S]{0,80}\bsignatures?\b/i,
    message:
      "OpsecForge JWT Decoder parses tokens but does not verify signatures",
  },
  {
    pattern:
      /(?:Environment Variable|Env|Safe-to-Share) Sanitizer[\s\S]{0,220}\b(?:guarantees?|detects?\s+all|removes?\s+all)\b/i,
    message:
      "OpsecForge sanitizer is heuristic and cannot guarantee exhaustive detection",
  },
];

for (const file of files) {
  const content = readFileSync(file, "utf8");
  const cves = [...new Set((content.match(CVE_PATTERN) ?? []).map((id) => id.toUpperCase()))];

  for (const claim of unsupportedProductClaims) {
    if (claim.pattern.test(content)) {
      failures.push(`${file}: ${claim.message}`);
    }
  }

  if (highRiskClaimPattern.test(content)) {
    if (!/^source_reviewed:\s*["']?\d{4}-\d{2}-\d{2}["']?\s*$/m.test(content)) {
      failures.push(`${file}: high-risk factual claims require source_reviewed: YYYY-MM-DD frontmatter`);
    }

    if (!/^primary_source:\s*["']?https:\/\/\S+["']?\s*$/m.test(content)) {
      failures.push(`${file}: high-risk factual claims require a primary_source URL`);
    }
  }

  if (cves.length === 0) continue;

  if (!/^source_reviewed:\s*["']?\d{4}-\d{2}-\d{2}["']?\s*$/m.test(content)) {
    failures.push(`${file}: CVE content requires source_reviewed: YYYY-MM-DD frontmatter`);
  }

  if (!/^primary_source:\s*["']?https:\/\/(?:github\.com\/[^/]+\/[^/]+\/security\/advisories\/GHSA-|nvd\.nist\.gov\/vuln\/detail\/CVE-)/m.test(content)) {
    failures.push(`${file}: CVE content requires an official advisory or NVD primary_source`);
  }

  for (const cve of cves) {
    const escaped = cve.replaceAll("-", "\\-");
    const nvdLink = new RegExp(`https://nvd\\.nist\\.gov/vuln/detail/${escaped}`, "i");
    if (!nvdLink.test(content)) {
      failures.push(`${file}: missing direct NVD source for ${cve}`);
    }
  }

  if (
    CONFIRMED_EXPLOIT_PATTERN.test(content) &&
    !/https:\/\/www\.cisa\.gov\/known-exploited-vulnerabilities-catalog/i.test(content)
  ) {
    failures.push(`${file}: confirmed-exploitation claims require a direct CISA KEV source`);
  }
}

if (failures.length > 0) {
  console.error("Content source verification failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Content source verification passed (${files.length} changed blog file(s)).`);
