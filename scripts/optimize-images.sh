#!/bin/bash
# Image optimization script for Codju AI Creator Camp
# Converts PNG/JPEG to WebP and resizes to appropriate display sizes

set -euo pipefail

ASSETS_DIR="$(cd "$(dirname "$0")/../assets" && pwd)"
TMP_DIR="$ASSETS_DIR/.opt_tmp"
mkdir -p "$TMP_DIR"

echo "=== Image Optimization for Codju AI Creator Camp ==="
echo ""

optimize() {
  local src="$1"
  local max_w="$2"
  local quality="${3:-10}"
  
  local basename="${src%.*}"
  local ext="${src##*.}"
  local webp_out="${basename}.webp"
  
  if [ ! -f "$ASSETS_DIR/$src" ]; then
    echo "  SKIP: $src"
    return
  fi
  
  local cur_w
  cur_w=$(sips -g pixelWidth "$ASSETS_DIR/$src" | tail -1 | awk '{print $2}')
  
  echo -n "  $src (${cur_w}px → ${max_w}px max): "
  
  # Copy to tmp
  cp "$ASSETS_DIR/$src" "$TMP_DIR/work.${ext}"
  
  # Resize if wider than target
  if [ "$cur_w" -gt "$max_w" ]; then
    sips --resampleWidth "$max_w" "$TMP_DIR/work.${ext}" >/dev/null 2>&1
  fi
  
  # Convert to WebP via ffmpeg
  ffmpeg -y -loglevel error -i "$TMP_DIR/work.${ext}" -quality "$quality" -compression_level 6 "$ASSETS_DIR/$webp_out" 2>/dev/null
  
  rm -f "$TMP_DIR/work.${ext}"
  
  local orig_size webp_size
  orig_size=$(stat -f%z "$ASSETS_DIR/$src")
  webp_size=$(stat -f%z "$ASSETS_DIR/$webp_out")
  local pct=$((webp_size * 100 / orig_size))
  echo "$(echo "scale=0; $orig_size/1024" | bc)KB → $(echo "scale=0; $webp_size/1024" | bc)KB (${pct}%)"
}

echo "--- Tool logos (96px for retina) ---"
for f in chatgpt.png elevenlabs.png canva.png notebooklm.png suno.png lovable.png make.png ideogram.png perplexity.png google_labs.png capcut.png gemini.png pika.png; do
  optimize "$f" 96 20
done

echo ""
echo "--- Day curriculum images (512px) ---"
for f in day1.png day2.png day3.png day4.png day5.png day6.png day7.png image.png; do
  optimize "$f" 512 30
done

echo ""
echo "--- Certificate & support (600px) ---"
for f in codju_certificate.png codju_support_update.png codju_support_cohort.png codju_support_mentor.png; do
  optimize "$f" 600 30
done

echo ""
echo "--- Logo & profile ---"
optimize "logo.png" 200 30
optimize "rohit_profile.jpeg" 400 30

# Cleanup
rm -rf "$TMP_DIR"

echo ""
echo "=== Summary ==="
total_orig=0
total_webp=0
count=0
for webp in "$ASSETS_DIR"/*.webp; do
  [ -f "$webp" ] || continue
  ws=$(stat -f%z "$webp")
  total_webp=$((total_webp + ws))
  count=$((count + 1))
  base="${webp%.webp}"
  for ext in png jpeg jpg; do
    if [ -f "${base}.${ext}" ]; then
      os=$(stat -f%z "${base}.${ext}")
      total_orig=$((total_orig + os))
      break
    fi
  done
done
echo "Files: $count WebP images created"
echo "Original total: $(echo "scale=0; $total_orig/1024" | bc) KB"
echo "WebP total: $(echo "scale=0; $total_webp/1024" | bc) KB"
echo "Savings: $(echo "scale=0; ($total_orig-$total_webp)/1024" | bc) KB"
