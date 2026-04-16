# Icons

- **Imports**: Always use project's configured `iconLibrary` (e.g., `lucide-react`, `@tabler/icons-react`). Never assume `lucide-react` without checking.
- **Button Icons**: In buttons, add `data-icon="inline-start"` or `data-icon="inline-end"` to the icon element.
- **Sizing**: NO sizing classes on icons inside components (no `size-4`, no `w-4 h-4`). Components size icons automatically.
- **Props**: Pass icons as React components (`icon={CheckIcon}`), not string keys.
