#!/usr/bin/env bash
set -euo pipefail

# 1. Zero emojis
if ! command -v rg &>/dev/null; then
  echo "Error: ripgrep (rg) is not installed" >&2
  exit 1
fi
if rg -n '\p{Emoji}' components/ app/; then
  echo "Error: Found emojis in components/ or app/" >&2
  exit 1
fi
# 2. Zero gradient text
if grep -RinE 'bg-clip-text' components/ app/; then
  echo "Error: Found bg-clip-text in components/ or app/" >&2
  exit 1
fi
# 3. Zero purple/violet/indigo
if grep -RinE 'purple|violet|indigo' components/ app/; then
  echo "Error: Found purple/violet/indigo colors in components/ or app/" >&2
  exit 1
fi
# 4. Zero h-screen
if grep -RinE 'h-screen' components/ app/; then
  echo "Error: Found h-screen in components/ or app/" >&2
  exit 1
fi
# 5. Zero justify-center on hero
# (Checked visually, only used on flex containers for icons and diagrams)
# 6. Zero generic AI chat layout
# (Checked visually, uses 40/60 layout)
# 7. Zero identical-card grids
# (Checked visually)
# 8. Language selector abbreviated
grep -Rinw 'BN' components/AppHeader.tsx
# 9. Icon-only buttons have aria-label
grep -Rin 'aria-label' components/AppHeader.tsx components/SolutionPanel.tsx components/HistorySidebar.tsx
# 10. Phosphor icons imported correctly
grep -Rin '@phosphor-icons' components/
# 11. CSS animations use transform/opacity
if grep -A 10 '@keyframes' app/globals.css | grep -vE '@keyframes|transform|opacity|{|}|/\*|\*/' | grep -E '^\s*[a-z-]+\s*:'; then
  echo "Error: Found CSS animations using properties other than transform/opacity" >&2
  exit 1
fi
# 12. Sidebar uses class toggle
grep -Rin 'sidebar-panel' components/HistorySidebar.tsx
# 13. Solution streaming uses <pre> with streaming-cursor
grep -Rin 'streaming-cursor' components/SolutionPanel.tsx
# 14. After streaming, swap to ReactMarkdown
grep -Rin 'ReactMarkdown' components/SolutionPanel.tsx
# 15. Scan line animation is CSS ::after
grep -Rin 'scanner-active::after' app/globals.css
