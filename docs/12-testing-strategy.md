# Testing Strategy

## Test Types
- Unit tests for order calculations and status transitions
- Widget tests for order list and forms
- Integration tests for order creation and status updates
- Offline sync tests with network toggling

## Coverage Goals
- Core order workflow: 90% of logic
- Summary calculations: 100%

## Manual QA
- Low-end Android devices
- Burmese fonts and layout checks
- Slow network and offline scenarios

## Release Checklist
- No crash reports in last 24 hours
- Sync conflicts handled correctly
- API authorization policies reviewed
