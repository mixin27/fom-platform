# FOM Brand Graphics Pack

This directory contains generated branding assets for the FOM - Order Manager platform.

## Structure

- assets/svg/ source vector files
- assets/png/ raster exports
- preview/index.html visual preview + download page
- assets/manifest.json machine-readable asset index

## Asset Counts

- Social media: 4
- App and store: 9
- Web branding: 8
- Extras: 9
- Total: 30

## Alpha Policy

- opaque: 27 assets
- required_transparent: 3 assets

Transparent assets are limited to:

- app/adaptive-icon-foreground
- app/notification-icon-light
- app/notification-icon-dark

## Regenerate

Run from repository root:

node fom_brand_graphics/generate_assets.js
