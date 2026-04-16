# Forms & Inputs
- **Layout**: Always use `FieldGroup` + `Field`. No raw `div` with `space-y`. Use `FieldLabel` (add `className="sr-only"` to hide).
- **Controls**: `Input` (text), `Select`/`Combobox` (dropdowns), `Switch`/`Checkbox` (booleans), `RadioGroup`/`ToggleGroup` (options), `InputOTP` (code).
- **InputGroup**: Use `InputGroupInput` or `InputGroupTextarea` inside `InputGroup`. No raw `Input`.
- **Input + Button**: Group using `InputGroup` + `InputGroupAddon`.
- **ToggleGroup**: Use for 2-7 options instead of rendering custom active Buttons.
- **FieldSet**: Use `<FieldSet>` + `<FieldLegend>` to group checkboxes/radios.
- **Validation**: Apply `data-invalid` / `data-disabled` to `<Field>`. Apply `aria-invalid` / `disabled` to the control (`Input`, etc).
