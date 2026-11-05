#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
REPORT="${2:-svr-vr-asset-audit.txt}"

{
  echo "SVR VR Asset Audit"
  echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Root: $(realpath "$ROOT")"
  echo

  echo "== Repository/asset footprint =="
  du -sh "$ROOT" 2>/dev/null || true
  echo

  echo "== GLB/GLTF over 5 MB =="
  find "$ROOT" -type f \( -iname '*.glb' -o -iname '*.gltf' \) -size +5M -printf '%s %p\n' 2>/dev/null | sort -nr | awk '{printf "%.1f MB  ",$1/1048576; $1=""; sub(/^ /,""); print}'
  echo

  echo "== Textures over 2 MB =="
  find "$ROOT" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' -o -iname '*.ktx2' \) -size +2M -printf '%s %p\n' 2>/dev/null | sort -nr | awk '{printf "%.1f MB  ",$1/1048576; $1=""; sub(/^ /,""); print}'
  echo

  echo "== Very large media files over 20 MB =="
  find "$ROOT" -type f \( -iname '*.mp4' -o -iname '*.webm' -o -iname '*.wav' -o -iname '*.mp3' \) -size +20M -printf '%s %p\n' 2>/dev/null | sort -nr | awk '{printf "%.1f MB  ",$1/1048576; $1=""; sub(/^ /,""); print}'
  echo

  echo "== Duplicate asset basenames =="
  find "$ROOT" -type f \( -iname '*.glb' -o -iname '*.gltf' -o -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' \) -printf '%f\n' 2>/dev/null | sort | uniq -d | head -200
  echo

  echo "== Top 50 largest files =="
  find "$ROOT" -type f -printf '%s %p\n' 2>/dev/null | sort -nr | head -50 | awk '{printf "%.1f MB  ",$1/1048576; $1=""; sub(/^ /,""); print}'
} > "$REPORT"

echo "Audit written to $REPORT"
