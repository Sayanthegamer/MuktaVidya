# ADR-0005: Package Manager Consolidation to pnpm

## Context
The project root currently contains both `package-lock.json` (npm) and `pnpm-lock.yaml` / `pnpm-workspace.yaml` (pnpm). Having two lockfiles leads to non-deterministic dependency versions, cache collisions in CI/CD, and developer confusion. MuktaVidya is hosted on Vercel.

## Decision
We standardize strictly on `pnpm`:
1. Remove `package-lock.json`.
2. Retain `pnpm-lock.yaml` and `pnpm-workspace.yaml`.
3. Vercel natively detects `pnpm-lock.yaml` and uses pnpm's content-addressable storage, optimizing install times and preventing ghost dependencies.

## Status
Accepted

## Consequences
- Single source of truth for all dependency versions.
- Faster cold builds on Vercel and local developer environments.
