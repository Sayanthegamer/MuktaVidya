# 2024-06-03 - [Missing Accessible Names on Icons]

**Learning:** Components here often rely on generic tooltips (`title`) or adjacent text. Icon-only buttons (like Rescan and Textarea) need explicit `aria-label`s since they lack inner text that screen readers can parse.
**Action:** Always check `react-phosphor-icons` wrapping elements for explicit `aria-label`s.

# 2024-06-03 - [Live Regions for Dynamic Errors]

**Learning:** `ErrorBanner` had `role="alert"` but no explicit `aria-live`. For dynamic client-side additions (like React error states appearing without a page load), `aria-live="assertive"` guarantees immediate screen reader interruption.
**Action:** Include `aria-live` along with `role="alert"` for dynamically rendered critical alerts.

## 2024-06-03 - [Dynamic Loading States and Async Operations]
**Learning:** During image compression with `browser-image-compression`, the application thread can be blocked or busy, and users receive no visual feedback that an action has been taken. Furthermore, adding `aria-live="polite"` directly to state-toggled wrapping elements (like the Analyzing overlay) creates reliable screen reader announcements when they appear or disappear.
**Action:** Always wrap long-running client-side async processes (like file processing) in an explicit boolean state (e.g., `isCompressing`) and display a loading indicator. Apply `aria-live="polite"` and `aria-busy` to dynamically toggled processing overlays.
