#!/bin/bash
# Reference: the exact ffmpeg commands used to cut the "reel-cuadro-meam"
# Instagram Reel from 5 raw iPhone clips (cinematic-mode) of a painting.
# Not meant to be re-run as-is (the input paths were session upload paths
# that won't exist afterwards) — copy the pattern for the next edit:
#
#   - one -ss/-t per source clip (trims at the demuxer level, no filter
#     needed) picks the in/out points for that shot
#   - [N:v]scale=1080:1920[vN] normalizes every shot to Reels' 1080x1920
#   - shot 3 additionally uses `crop` with a time-varying `y` expression
#     (y='300+(550*t/2.3)') to fake a vertical pan across the canvas from
#     otherwise-static footage, while cropping the viewer out of frame
#   - `concat` hard-cuts the shots together (this ffmpeg build has no
#     `xfade`/`fade`, so no crossfades — hard cuts fit a punchy Reel anyway)
#   - `loudnorm` evens out the ambient audio levels across clips shot in
#     different moments
#
# IMPORTANT: this build's `-filter_complex` + `concat` combo reintroduces a
# stray "rotate -90" flag on the output even though the pixels are already
# correctly oriented (a real ffmpeg gotcha, see fix-iphone-rotation.sh).
# Always run that script as a second pass on whatever this produces.
set -e
cd "$(dirname "$0")/.."
FF=node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg
U=/root/.claude/uploads/cca40a40-aebe-5c4c-a85d-fefa8e6c42bb   # session upload dir (example only)
RAW=out/reel-cuadro-meam.raw.mp4
OUT=out/reel-cuadro-meam.mp4

"$FF" -y \
  -ss 0.0 -t 2.4 -i "$U/cce3ea1e-IMG_2574.mov" \
  -ss 0.3 -t 1.8 -i "$U/9cf96f2f-IMG_2580.mov" \
  -ss 0.8 -t 2.3 -i "$U/d985ca56-IMG_2581.mov" \
  -ss 0.5 -t 2.8 -i "$U/2e0ec7b3-IMG_2582.mov" \
  -ss 0.2 -t 2.5 -i "$U/3ac118e1-IMG_8785.mov" \
  -filter_complex "\
[0:v]scale=1080:1920[v0];\
[0:a]aformat=sample_rates=48000:channel_layouts=stereo[a0];\
[1:v]scale=1080:1920[v1];\
[1:a]aformat=sample_rates=48000:channel_layouts=stereo[a1];\
[2:v]crop=w=950:h=1689:x=0:y='300+(550*t/2.3)',scale=1080:1920[v2];\
[2:a]aformat=sample_rates=48000:channel_layouts=stereo[a2];\
[3:v]scale=1080:1920[v3];\
[3:a]aformat=sample_rates=48000:channel_layouts=stereo[a3];\
[4:v]scale=1080:1920[v4];\
[4:a]aformat=sample_rates=48000:channel_layouts=stereo[a4];\
[v0][a0][v1][a1][v2][a2][v3][a3][v4][a4]concat=n=5:v=1:a=1[vcat][acat];\
[acat]loudnorm=I=-16:TP=-1.5:LRA=11[aout]" \
  -map "[vcat]" -map "[aout]" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 18 -preset medium \
  -c:a aac -b:a 192k -ar 48000 \
  -movflags +faststart \
  "$RAW"

./scripts/fix-iphone-rotation.sh "$RAW" "$OUT"
rm "$RAW"
