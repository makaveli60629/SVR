#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 path/to/model.glb [output.glb]"
  exit 1
fi

INPUT="$1"
if [[ ! -f "$INPUT" ]]; then
  echo "Input not found: $INPUT"
  exit 1
fi

BASE="${INPUT%.*}"
OUTPUT="${2:-${BASE}.optimized.glb}"

if ! command -v gltf-transform >/dev/null 2>&1; then
  echo "gltf-transform is not installed. Run the IONOS bootstrap first."
  exit 1
fi

echo "[SVR] Original:"
du -h "$INPUT"

# Produces a new optimized copy; original is never overwritten.
gltf-transform optimize "$INPUT" "$OUTPUT" --compress meshopt

echo "[SVR] Optimized:"
du -h "$OUTPUT"
echo "[SVR] Output: $OUTPUT"
