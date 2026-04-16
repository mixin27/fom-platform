---
name: shadcn
description: Manages shadcn components for Web. Triggers on: shadcn, components.json, --preset, apps/web, apps/admin.
user-invocable: false
allowed-tools: Bash(npx shadcn@latest *), Bash(pnpm dlx shadcn@latest *), Bash(bunx --bun shadcn@latest *)
---
# shadcn/ui Rules
Run CLI via project package manager (e.g. `npx shadcn@latest`). Run `info --json` for config.

## Core Rules & References
- **Styling**: `className` for layout only. No `space-x/y` (use `flex gap-*`). Use `size-*`. Use `truncate`. No manual `dark:` overrides (use semantic tokens). Use `cn()`. No manual `z-index` on overlays. [See styling.md](./rules/styling.md).
- **Forms**: Use `FieldGroup`+`Field`. `InputGroup` uses `InputGroupInput/Textarea`. Option sets use `ToggleGroup`. `FieldSet`+`FieldLegend` for checkboxes/radios. Validation uses `data-invalid` & `aria-invalid`. [See forms.md](./rules/forms.md).
- **Structure**: Items inside Groups. Triggers use `asChild`/`render`. Overlays require Titles. Use full Card composition. Button loading uses `Spinner`+`data-icon`+`disabled`. TabsTrigger in TabsList. Avatar needs Fallback. Use built-in components (Alert, Empty, Separator, Skeleton, Badge) before custom markup. [See composition.md](./rules/composition.md) & [base-vs-radix.md](./rules/base-vs-radix.md).
- **Icons**: Inside Buttons use `data-icon="inline-start/end"`. No sizing classes on icons (`size-4`). Pass as objects (`icon={CheckIcon}`). [See icons.md](./rules/icons.md).
- **CLI**: Pass code directly `init --preset <code>`. Context fields check: `aliases`, `isRSC` (add `"use client"`), `tailwindVersion`, `style`, `base`, `iconLibrary`, `framework`. [See cli.md](./cli.md) & [customization.md](./customization.md).

## Workflow
1. Check installed components (`info`).
2. Search (`search <query>`).
3. Fetch docs (`docs <component>`).
4. Preview (`add --dry-run` or `--diff`).
5. Install (`add <component>`). Check and fix 3rd-party component imports.
6. Updating: compare using `--diff`. Smart merge local modifications. Never `--overwrite` without approval.
7. Presets: Ask to reinstall/merge/skip. Always run in project root.

## CLI Quick Reference
- Init: `init --name <app> --preset <preset> [--template <template>] [--monorepo]`
- Add: `add <comp>`, `add --all`, `add <comp> --dry-run / --diff <file>`
- Search: `search <registry> -q <query>`
- Docs: `docs <comp>`
- View: `view <registry>/<item>`
