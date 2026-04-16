---
name: turborepo
description: Turborepo build system rules (v2.9.6+).
---
# Rules & Anti-Patterns
- **Tasks**: Add scripts to `package.json` in packages, root delegates via `turbo run <task>`.
- **CLI**: Always use `turbo run <task>` in scripts/CI.
- **Deps**: Use `^<task>` in `dependsOn` for topology ordering.
- **Env**: List build vars in `env` or `globalEnv` for proper hashing.
- **Inputs**: Use `$TURBO_ROOT$` instead of `../` for root paths.
- **Outputs**: Tasks producing files MUST define `outputs` array to cache.

# References
- [Tasks](./references/configuration/tasks.md)
- [Env](./references/environment/RULE.md)
- [Caching](./references/caching/RULE.md)
- [Filtering](./references/filtering/RULE.md)
- [Best Practices](./references/best-practices/RULE.md)
- [CI](./references/ci/RULE.md)
