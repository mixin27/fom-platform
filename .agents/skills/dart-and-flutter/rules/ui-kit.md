# UI Kit & Component Rules

This project uses a custom UI Kit (`app_ui_kit`) to maintain visual consistency across all mobile applications.

## Standard Component Usage

**ALWAYS** check `packages/app_ui_kit/lib/src/components` before using standard Flutter material widgets.

### Common Mappings

| Standard Flutter Widget | UI Kit Component |
| :--- | :--- |
| `ElevatedButton` / `TextButton` | `AppButton` |
| `TextField` | `AppTextField` |
| `CircleAvatar` | `AppAvatar` |
| `SearchBar` | `AppSearchBar` |
| `Card` | `AppCard` or `AppOrderCard` |
| `Badge` | `AppStatusBadge` |
| `LinearProgressIndicator` | `AppProgressBarDots` |
| `CustomScrollView` (Search) | `AppSearchBar` + `AppFilterTabs` |

## Design Tokens

Do not used hardcoded colors or spacing. Use the tokens provided by the UI Kit.

### 1. Colors
- **Correct**: `context.theme.colors.primary` or `AppColors.brand`
- **Incorrect**: `Colors.blue` or `Color(0xFF...)`

### 2. Spacing
- Use standard gaps:
  - `Gap.xs` (4), `Gap.s` (8), `Gap.m` (16), `Gap.l` (24), `Gap.xl` (32)
- **Example**: `Column(children: [Text('A'), Gap.m, Text('B')])`

## Best Practices

- **Atomic Components**: If a UI element is used more than twice across different features, consider moving it to `app_ui_kit`.
- **Theming**: Always support Light and Dark modes. Use `AppTheme.of(context)` to access theme-aware values.
- **Icons**: Use the icon library defined in `app_ui_kit` (e.g., Lucide or standard Material Icons if extended).

## Code Example

### Incorrect: Using Raw Widgets
```dart
ElevatedButton(
  onPressed: () {},
  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
  child: Text('Submit'),
)
```

### Correct: Using UI Kit
```dart
AppButton(
  onPressed: () {},
  variant: AppButtonVariant.primary,
  text: 'Submit',
)
```
