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

## 2024-06-08 - [Dynamic Tooltips for Disabled States]
**Learning:** The application had disabled buttons (like "Send Message" and "Attach Image" in `FloatingDock.tsx`, and "Thumbs Up / Thumbs Down" in `ActionBar.tsx`) that lacked clear indications for why they were disabled, leaving users confused. Native `disabled` attributes block pointer events on some browsers. To display tooltips correctly on disabled states, `aria-disabled="true"` with custom styling should be used to ensure the `title` attribute triggers correctly without dropping events.
**Action:** When designing a disabled state for interactive elements where an explanatory tooltip is needed, use `aria-disabled="true"` and handle the disabled visual/functional logic through custom CSS and event handlers, instead of relying on the native `disabled` attribute.

## 2026-06-10 - [Dynamic Loading Feedback during Upload Compression]
**Learning:** Operations like client-side image compression block the main thread momentarily and take noticeable time, especially on low-end devices. Disabling inputs without explicit visual feedback like a spinner or "Processing..." text leaves the user guessing if their click registered or if the app froze.
**Action:** Always surface explicit, active loading text and an `aria-busy` region for any multi-second client-side file processing, even if it happens before an API request begins. Replace relevant icon buttons with spinners and use `aria-live` properties.


## 2024-06-12 - [Invalid ARIA Nesting & Focus Rings]
**Learning:** Adding `role="button"` or `tabIndex={0}` to an element (like a `<label>` or `<div>`) that *already* contains interactive elements (like `<button>`) results in an invalid HTML/ARIA structure. This severely degrades the screen reader experience. Focus rings should instead be added to the individual native interactive elements.
**Action:** Always check the children of a container before making it focusable or changing its role. Use `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]` on native interactive elements (like `<button>` or `<a>`) to ensure a consistent, accessible keyboard navigation experience.

## 2024-06-15 - [Textarea Accessibility During Streaming States]
**Learning:** Disabling a `textarea` during long, multi-second AI streaming generation states creates a poor UX because native `disabled` attributes block users from scrolling long multi-line text or selecting text to copy.
**Action:** When locking inputs during streaming states, use `readOnly` instead of `disabled` to preserve interaction (scrolling, text selection) while preventing edits. Additionally, use a dynamic `placeholder` to provide immediate context on why the input is locked (e.g., "AI is generating...").
