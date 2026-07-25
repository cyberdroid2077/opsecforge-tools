---
title: "Shadow APIs: How to Find and Govern Unknown Endpoints"
date: "2026-03-28"
updated: "2026-07-24"
description: "A defensive guide to discovering undocumented API hosts, versions, routes, and data flows without relying on unsupported incident statistics."
author: "OpsecForge Security Team"
category: "API Security"
tags: ["Shadow APIs", "API Discovery", "DevSecOps", "API Inventory", "Attack Surface"]
source_reviewed: "2026-07-24"
primary_source: "https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/"
---

# Shadow APIs: How to Find and Govern Unknown Endpoints

A shadow API is an API host, version, or route that is active but absent from the organization's reliable inventory and governance process. It may be an old version, a direct service endpoint that bypasses the gateway, a test deployment using production data, or an integration that outlived its owner.

This page previously used unsupported percentages, incident counts, and a purported social-media incident. Those claims have been removed. The risk is adequately described by [OWASP API9:2023 Improper Inventory Management](https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/): outdated documentation and missing retirement strategies can leave unpatched or unnecessarily exposed API systems running.

## Where unknown endpoints come from

- A temporary service remains deployed after a project ends.
- A new API version launches before documentation and ownership are updated.
- A service is reachable directly as well as through the gateway.
- A partner callback or webhook has no recorded owner or data-flow review.
- Staging or test infrastructure uses production data or production credentials.

## Build an evidence-based inventory

Compare multiple sources rather than trusting a single catalog:

1. Gateway and ingress configurations.
2. Cloud load balancers, DNS records, certificates, and service discovery.
3. Deployment manifests and infrastructure-as-code.
4. Access logs and traces, reviewed without exposing credentials or sensitive bodies.
5. API specifications and developer documentation.
6. Third-party integration and data-flow records.

Differences between those sources are investigation targets. Confirm ownership before changing or shutting down an endpoint.

## Record what matters

For every host and version, document the owner, environment, intended audience, authentication and authorization model, sensitive data handled, upstream and downstream dependencies, current supported version, and retirement plan.

## Reduce drift

Generate API documentation from version-controlled specifications where feasible. Add inventory updates to deployment and decommission workflows. Block public exposure of a new host until it has an owner and review. Periodically reconcile observed traffic with the declared inventory.

## Test safely

Use passive records and authorized internal assessment first. Do not scan systems you do not own or have permission to test. Discovery is only the beginning: an endpoint can be documented and still have authorization, configuration, or data-exposure flaws.

## Primary source

- [OWASP API9:2023 Improper Inventory Management](https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/)
