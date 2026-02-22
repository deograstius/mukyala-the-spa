#!/usr/bin/env bash
set -euo pipefail

# Generate square service card still images from our loop videos.
#
# Outputs:
# - public/images/<slug>.jpg (1024w)
# - public/images/<slug>-p-800.jpg (800w)
# - public/images/<slug>-p-500.jpg (500w)
#
# Usage:
#   cd mukyala-the-spa
#   ./scripts/generate-service-still-images.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VIDEOS_DIR="${ROOT_DIR}/public/videos"
IMAGES_DIR="${ROOT_DIR}/public/images"

mkdir -p "${IMAGES_DIR}"

SLUGS=(
  "hydrafacial"
  "lash-extensions"
  "brow-lamination"
  "microcurrent-facial"
  "dermaplaning-facial"
  "chemical-peel"
  "full-body-wax"
)

for slug in "${SLUGS[@]}"; do
  in="${VIDEOS_DIR}/${slug}.mp4"
  if [[ ! -f "${in}" ]]; then
    echo "[stills] missing video: ${in}" >&2
    exit 1
  fi

  out_1024="${IMAGES_DIR}/${slug}.jpg"
  out_800="${IMAGES_DIR}/${slug}-p-800.jpg"
  out_500="${IMAGES_DIR}/${slug}-p-500.jpg"

  echo "[stills] ${slug}"

  # Crop to a centered square while preserving content, then scale to a consistent output size.
  ffmpeg -hide_banner -loglevel error -y \
    -i "${in}" \
    -frames:v 1 \
    -vf "scale=1024:1024:force_original_aspect_ratio=increase,crop=1024:1024" \
    -q:v 2 \
    "${out_1024}"

  ffmpeg -hide_banner -loglevel error -y \
    -i "${out_1024}" \
    -vf "scale=800:800" \
    -q:v 3 \
    "${out_800}"

  ffmpeg -hide_banner -loglevel error -y \
    -i "${out_1024}" \
    -vf "scale=500:500" \
    -q:v 3 \
    "${out_500}"
done

echo "[stills] done -> ${IMAGES_DIR}"
