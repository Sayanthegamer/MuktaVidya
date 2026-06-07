# 2024-06-03 - [Missing Accessible Names on Icons]

**Learning:** Components here often rely on generic tooltips (`title`) or adjacent text. Icon-only buttons (like Rescan and Textarea) need explicit `aria-label`s since they lack inner text that screen readers can parse.
**Action:** Always check `react-phosphor-icons` wrapping elements for explicit `aria-label`s.

# 2024-06-03 - [Live Regions for Dynamic Errors]

**Learning:** `ErrorBanner` had `role="alert"` but no explicit `aria-live`. For dynamic client-side additions (like React error states appearing without a page load), `aria-live="assertive"` guarantees immediate screen reader interruption.
**Action:** Include `aria-live` along with `role="alert"` for dynamically rendered critical alerts.

## 2024-06-03 - [Dynamic Loading States and Async Operations]

**Learning:** During image compression with `browser-image-compression`, the application thread can be blocked or busy, and users receive no visual feedback that an action has been taken. Furthermore, adding `aria-live="polite"` directly to state-toggled wrapping elements (like the Analyzing overlay) creates reliable screen reader announcements when they appear or disappear.
**Action:** Always wrap long-running client-side async processes (like file processing) in an explicit boolean state (e.g., `isCompressing`) and display a loading indicator. Apply `aria-live="polite"` and `aria-busy` to dynamically toggled processing overlays.

## 2024-06-05 - Icon Button & Stateful Toggle Accessibility
**Learning:** Several interactive toggles (like the History sidebar and Feedback thumbs) lacked `aria-expanded` and `aria-pressed` states, rendering their current status invisible to screen readers. Additionally, icon-only buttons lacked standard `title` attributes, missing an easy opportunity for visual tooltips.
**Action:** When creating toggleable sidebars, always link the trigger button to the sidebar using `aria-controls="[id]"` and `aria-expanded`. For stateful toggle buttons (like thumbs up/down), utilize `aria-pressed` and dynamic `aria-label`s. Ensure all purely visual icons within accessible buttons use `aria-hidden="true"`.

## 2024-06-08 - [Mobile Hover States & Async Form Submission Feedback]
**Learning:** A hover-only state for "remove attachment" rendered the action inaccessible on mobile touch screens, highlighting the need for persistent, accessible clear/close buttons. Additionally, hitting enter during async operations (like image compression) allowed premature submission due to the lack of an `isCompressing` check in the submission handler.
**Action:** Use fixed-position close badges for mobile-accessible removable items. When introducing async processing that precedes a main submission, explicitly disable the submission buttons and add early returns in the handlers to prevent race conditions.
