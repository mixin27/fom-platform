---
name: turborepo
description: |
  Turborepo build system guidance. Triggers on: turbo.json, turbo commands, task pipelines (dependsOn, outputs), or when the user asks about monorepo caching/filtering.
  
  Use when user: configures tasks, manages packages in the monorepo, or uses the "turbo" CLI.
metadata:
  version: 2.9.6-optimized
---

# Turborepo Skill

Build system for JavaScript/TypeScript monorepos.

## Core Rules

1.  **Package Tasks, Not Root Tasks**: ALWAYS add scripts to `package.json` of individual packages. Root `package.json` should only delegate via `turbo run <task>`.
2.  **Use `turbo run`**: When writing commands into code (scripts, CI), use `turbo run <task>`. Shortened `turbo <task>` is for terminal use only.
3.  **Dependency Order**: Use `^build` in `dependsOn` to ensure dependencies build before dependents.
4.  **Hashed Environment**: Ensure all build-time environment variables used by a task are listed in the `env` or `globalEnv` keys.

## Quick Reference

| Task | Reference File |
| :--- | :--- |
| **Pipeline/Tasks** | [configuration/tasks.md](./references/configuration/tasks.md) |
| **Environment** | [environment/RULE.md](./references/environment/RULE.md) |
| **Caching** | [caching/RULE.md](./references/caching/RULE.md) |
| **Filtering/Affected** | [filtering/RULE.md](./references/filtering/RULE.md) |
| **Monorepo Structure** | [best-practices/RULE.md](./references/best-practices/RULE.md) |
| **CI Setup** | [ci/RULE.md](./references/ci/RULE.md) |

## Common Anti-Patterns

- **Root Scripts Bypassing Turbo**: Don't run tools directly from the root if they should be managed by turbo.
- **Relatively Traversing Inputs**: Use `$TURBO_ROOT$` instead of `../` in `inputs`.
- **Missing Outputs**: If a task produces files, it MUST have an `outputs` array to be cached.

For detailed patterns, decision trees, and best practices, see the [References Directory](./references/).
