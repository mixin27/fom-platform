---
name: vercel-react-best-practices
description: React/Next.js optimizations. Triggers on: React, Next.js, apps/web.
---

# React Best Practices (69 Rules)

Read rule files in `rules/<rule-name>.md` for specifics.

1. **Waterfalls**: `async-cheap-condition-before-await`, `async-defer-await`, `async-parallel`, `async-dependencies`, `async-api-routes`, `async-suspense-boundaries`
2. **Bundle Size**: `bundle-barrel-imports`, `bundle-dynamic-imports`, `bundle-defer-third-party`, `bundle-conditional`, `bundle-preload`
3. **Server**: `server-auth-actions`, `server-cache-react`, `server-cache-lru`, `server-dedup-props`, `server-hoist-static-io`, `server-no-shared-module-state`, `server-serialization`, `server-parallel-fetching`, `server-parallel-nested-fetching`, `server-after-nonblocking`
4. **Client**: `client-swr-dedup`, `client-event-listeners`, `client-passive-event-listeners`, `client-localstorage-schema`
5. **Re-render**: `rerender-defer-reads`, `rerender-memo`, `rerender-memo-with-default-value`, `rerender-dependencies`, `rerender-derived-state`, `rerender-derived-state-no-effect`, `rerender-functional-setstate`, `rerender-lazy-state-init`, `rerender-simple-expression-in-memo`, `rerender-split-combined-hooks`, `rerender-move-effect-to-event`, `rerender-transitions`, `rerender-use-deferred-value`, `rerender-use-ref-transient-values`, `rerender-no-inline-components`
6. **Rendering**: `rendering-animate-svg-wrapper`, `rendering-content-visibility`, `rendering-hoist-jsx`, `rendering-svg-precision`, `rendering-hydration-no-flicker`, `rendering-hydration-suppress-warning`, `rendering-activity`, `rendering-conditional-render`, `rendering-usetransition-loading`, `rendering-resource-hints`, `rendering-script-defer-async`
7. **JS/Logic**: `js-batch-dom-css`, `js-index-maps`, `js-cache-property-access`, `js-cache-function-results`, `js-cache-storage`, `js-combine-iterations`, `js-length-check-first`, `js-early-exit`, `js-hoist-regexp`, `js-min-max-loop`, `js-set-map-lookups`, `js-tosorted-immutable`, `js-flatmap-filter`, `js-request-idle-callback`
8. **Advanced**: `advanced-effect-event-deps`, `advanced-event-handler-refs`, `advanced-init-once`, `advanced-use-latest`
