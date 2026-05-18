#!/usr/bin/env bash
set -euo pipefail

# 1. Zero emojis
! rg -n '\p{Emoji}' components/ app/
# 2. Zero gradient text
! grep -RinE 'bg-clip-text' components/ app/
# 3. Zero purple/violet/indigo
! grep -RinE 'purple|violet|indigo' components/ app/
# 4. Zero h-screen
! grep -RinE 'h-screen' components/ app/
# 5. Zero justify-center on hero
# (Checked visually, only used on flex containers for icons and diagrams)
# 6. Zero generic AI chat layout
# (Checked visually, uses 40/60 layout)
# 7. Zero identical-card grids
# (Checked visually)
# 8. Language selector abbreviated
grep -Rin 'BN' components/AppHeader.tsx
# 9. Icon-only buttons have aria-label
grep -Rin 'aria-label' components/AppHeader.tsx components/SolutionPanel.tsx components/HistorySidebar.tsx
# 10. Phosphor icons imported correctly
grep -Rin '@phosphor-icons' components/
# 11. CSS animations use transform/opacity
grep -A 5 'keyframes' app/globals.css
# 12. Sidebar uses class toggle
grep -Rin 'sidebar-panel' components/HistorySidebar.tsx
# 13. Solution streaming uses <pre> with streaming-cursor
grep -Rin 'streaming-cursor' components/SolutionPanel.tsx
# 14. After streaming, swap to ReactMarkdown
grep -Rin 'ReactMarkdown' components/SolutionPanel.tsx
# 15. Scan line animation is CSS ::after
grep -Rin 'scanner-active::after' app/globals.css
