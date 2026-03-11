#!/bin/bash
# Bulk convert dark-only Tailwind classes to dual-mode (light/dark)
# Usage: ./convert_theme.sh <file>

FILE="$1"
if [ -z "$FILE" ]; then
  echo "Usage: $0 <file.jsx>"
  exit 1
fi

echo "Converting: $FILE"

# Background colors
sed -i '' \
  -e 's/bg-slate-950 /bg-slate-50 dark:bg-slate-950 /g' \
  -e 's/bg-slate-950"/bg-slate-50 dark:bg-slate-950"/g' \
  -e 's/bg-slate-900\/50 /bg-white dark:bg-slate-900\/50 /g' \
  -e 's/bg-slate-900\/50"/bg-white dark:bg-slate-900\/50"/g' \
  -e 's/bg-slate-900\/60 /bg-white dark:bg-slate-900\/60 /g' \
  -e 's/bg-slate-900\/60"/bg-white dark:bg-slate-900\/60"/g' \
  -e 's/bg-slate-900\/70 /bg-white dark:bg-slate-900\/70 /g' \
  -e 's/bg-slate-900\/70"/bg-white dark:bg-slate-900\/70"/g' \
  -e 's/bg-slate-900\/90 /bg-white dark:bg-slate-900\/90 /g' \
  -e 's/bg-slate-900\/90"/bg-white dark:bg-slate-900\/90"/g' \
  -e 's/bg-slate-900 /bg-white dark:bg-slate-900 /g' \
  -e 's/bg-slate-900"/bg-white dark:bg-slate-900"/g' \
  -e 's/bg-slate-800\/50 /bg-slate-100 dark:bg-slate-800\/50 /g' \
  -e 's/bg-slate-800\/50"/bg-slate-100 dark:bg-slate-800\/50"/g' \
  -e 's/bg-slate-800\/30 /bg-slate-50 dark:bg-slate-800\/30 /g' \
  -e 's/bg-slate-800\/30"/bg-slate-50 dark:bg-slate-800\/30"/g' \
  -e 's/bg-slate-800\/60 /bg-slate-100 dark:bg-slate-800\/60 /g' \
  -e 's/bg-slate-800\/60"/bg-slate-100 dark:bg-slate-800\/60"/g' \
  -e 's/bg-slate-800\/80 /bg-slate-100 dark:bg-slate-800\/80 /g' \
  -e 's/bg-slate-800\/80"/bg-slate-100 dark:bg-slate-800\/80"/g' \
  -e 's/bg-slate-800 /bg-slate-200 dark:bg-slate-800 /g' \
  -e 's/bg-slate-800"/bg-slate-200 dark:bg-slate-800"/g' \
  "$FILE"

# Border colors
sed -i '' \
  -e 's/border-slate-800\/50/border-slate-200 dark:border-slate-800\/50/g' \
  -e 's/border-slate-800\/30/border-slate-200 dark:border-slate-800\/30/g' \
  -e 's/border-slate-800 /border-slate-200 dark:border-slate-800 /g' \
  -e 's/border-slate-800"/border-slate-200 dark:border-slate-800"/g' \
  -e 's/border-slate-700\/50/border-slate-200 dark:border-slate-700\/50/g' \
  -e 's/border-slate-700\/30/border-slate-200 dark:border-slate-700\/30/g' \
  -e 's/border-slate-700"/border-slate-200 dark:border-slate-700"/g' \
  -e 's/border-slate-700 /border-slate-200 dark:border-slate-700 /g' \
  "$FILE"

# Hover states
sed -i '' \
  -e 's/hover:bg-slate-800\/50/hover:bg-slate-100 dark:hover:bg-slate-800\/50/g' \
  -e 's/hover:bg-slate-800\/30/hover:bg-slate-100 dark:hover:bg-slate-800\/30/g' \
  -e 's/hover:bg-slate-800 /hover:bg-slate-100 dark:hover:bg-slate-800 /g' \
  -e 's/hover:bg-slate-800"/hover:bg-slate-100 dark:hover:bg-slate-800"/g' \
  -e 's/hover:bg-slate-700 /hover:bg-slate-100 dark:hover:bg-slate-700 /g' \
  -e 's/hover:bg-slate-700"/hover:bg-slate-100 dark:hover:bg-slate-700"/g' \
  -e 's/hover:text-white/hover:text-slate-900 dark:hover:text-white/g' \
  "$FILE"

# Text colors — convert text-white to dual-mode (context-aware)
sed -i '' \
  -e 's/font-black text-white/font-black text-slate-900 dark:text-white/g' \
  -e 's/font-bold text-white/font-bold text-slate-900 dark:text-white/g' \
  -e 's/font-semibold text-white/font-semibold text-slate-900 dark:text-white/g' \
  -e 's/font-medium text-white/font-medium text-slate-900 dark:text-white/g' \
  -e 's/text-white tracking/text-slate-900 dark:text-white tracking/g' \
  -e 's/text-white truncate/text-slate-900 dark:text-white truncate/g' \
  -e 's/text-2xl text-white/text-2xl text-slate-900 dark:text-white/g' \
  -e 's/text-3xl text-white/text-3xl text-slate-900 dark:text-white/g' \
  -e 's/text-xl text-white/text-xl text-slate-900 dark:text-white/g' \
  -e 's/text-lg text-white/text-lg text-slate-900 dark:text-white/g' \
  -e 's/text-sm text-white/text-sm text-slate-900 dark:text-white/g' \
  -e 's/text-xs text-white/text-xs text-slate-900 dark:text-white/g' \
  -e 's/text-base text-white/text-base text-slate-900 dark:text-white/g' \
  "$FILE"

# Input-specific: text-white in inputs → ensure readable in light mode
sed -i '' \
  -e 's/placeholder:text-slate-500/placeholder:text-slate-400 dark:placeholder:text-slate-500/g' \
  "$FILE"

# Scrollbar overlay on dark bg
sed -i '' \
  -e 's/bg-slate-950\/60/bg-black\/30 dark:bg-slate-950\/60/g' \
  "$FILE"

echo "Done: $FILE"
