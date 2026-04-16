# Base vs Radix (Check `base` field from `info`)

- **Composition**: Radix uses `asChild` on triggers (e.g. `<DialogTrigger asChild><Button/></DialogTrigger>`). Base uses `render` (`<DialogTrigger render={<Button/>} />`).
- **Non-button triggers (Base)**: When `render` is a non-button (like `<a>`), add `nativeButton={false}`.
- **Select (Base)**: Requires `items` prop array of objects. `placeholder` is `{ value: null }`. Use `alignItemWithTrigger={false}` for positioning. Supports `multiple`.
- **Select (Radix)**: Uses inline JSX and `<SelectValue placeholder="..." />`.
- **ToggleGroup (Base)**: Uses `multiple` boolean prop. `defaultValue` is always an array.
- **ToggleGroup (Radix)**: Uses `type="single"` or `type="multiple"`. Single uses string, multiple uses array.
- **Slider (Base)**: Single thumb uses plain number (`defaultValue={50}`).
- **Slider (Radix)**: Always requires array (`defaultValue={[50]}`).
- **Accordion (Base)**: Uses `multiple` boolean prop. `defaultValue` is always an array.
- **Accordion (Radix)**: Requires `type="single"|multiple` and `collapsible`. `defaultValue` is string (single) or array.
