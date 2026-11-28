#!/usr/bin/env bash
# One-shot visual check. Usage: tools/check.sh [laferrari|chiron|jesko|all]
# Needs: node, python3 with numpy + pillow. Output PNGs land in tools/out/.
set -e
cd "$(dirname "$0")"
SRC="${HC_SRC:-../index.html}"
node extract.js "$SRC"
node dump.js
mkdir -p out
CARS="${1:-all}"; [ "$CARS" = all ] && CARS="laferrari chiron jesko"
for c in $CARS; do python3 render.py "$c" front34 side rear34 front >/dev/null; mv -f out_${c}_*.png out/ ; done
echo "renders in tools/out/  (front34 = in-game menu angle)"
