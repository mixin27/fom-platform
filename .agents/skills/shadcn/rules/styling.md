# Styling & Customization

- **Semantic Colors**: Use tokens (`bg-primary`, `text-muted-foreground`), NEVER raw tailwind colors. Fix status colors via `Badge` variants or CSS variables.
- **Variants**: Use built-in variant props (e.g. `variant="outline"`) before manual styling.
- **className Rules**: Use for layout (`max-w-md`, `mt-4`) ONLY. Do not override component colors.
- **Spacing**: Use `flex gap-*`. NO `space-x-*` or `space-y-*`.
- **Sizing**: Use `size-*` instead of `w-* h-*` when equal. Use `truncate` shorthand.
- **Dark Mode**: No manual `dark:` overrides; rely on CSS variables.
- **Conditional Classes**: Always wrap dynamic logic in `cn()`.
- **Z-Index**: NO manual `z-index` on overlays (Dialog, Sheet, Popover) - they stack automatically.
