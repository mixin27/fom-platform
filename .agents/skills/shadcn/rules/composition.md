# Component Composition

- **Groups**: Items MUST be inside their group container (`SelectItem` inside `SelectGroup`, etc).
- **Alert**: Use for callouts.
- **Empty**: Use for empty states instead of custom markup.
- **Toast**: Use `toast()` from `sonner`.
- **Overlays**: `Dialog` (tasks), `AlertDialog` (destructive), `Sheet` (side panel), `Drawer` (mobile bottom), `HoverCard` (hover info), `Popover` (click info).
- **Titles**: `Dialog`, `Sheet`, `Drawer` always require a Title component. Use `className="sr-only"` to hide visually.
- **Card**: Use full composition (`CardHeader`/`Title`/`Description`/`Content`/`Footer`).
- **Button Loading**: Compose using `<Button disabled><Spinner data-icon="inline-start" />...</Button>`. No `isLoading` prop.
- **Tabs**: `TabsTrigger` MUST be inside `TabsList`.
- **Avatar**: Always include `AvatarFallback`.
- **Primitives**: Use `<Separator />` (not hr), `<Skeleton />` (not custom pulse div), `<Badge>` (not custom span).
