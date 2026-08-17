#!/bin/bash
# Fixes a known ffmpeg gotcha: when you build a multi-clip edit from iPhone
# footage via -filter_complex (crop/scale/concat, etc.), the exported file
# often ends up with a stray "displaymatrix: rotation of -90 degrees" flag
# on the output stream, even though the actual pixels were already rotated
# correctly by the filtergraph. Players (and ffprobe/ffmpeg readers) then
# apply an *extra* rotation on top of already-correct pixels, so previews
# come out sideways.
#
# Root cause: ffmpeg's muxer copies the STREAM-level side data (the
# QuickTime tkhd rotation matter) from an input stream onto the output
# stream, independent of what the filtergraph did to the frames. Neither
# `-metadata:s:v:0 rotate=0` nor a `transpose` no-op filter clears it
# reliably once `concat` is involved. What *does* work: telling ffmpeg to
# treat the (buggy) input's rotation as 0 via `-display_rotation`, used as
# an INPUT option (this build only accepts it there, not as an output
# option) on a second, stream-copy-ish pass over the already-rendered file.
#
# Usage: ./fix-iphone-rotation.sh <in.mp4> <out.mp4>
set -e
FF="$(dirname "$0")/../node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg"
IN="$1"
OUT="$2"
if [ -z "$IN" ] || [ -z "$OUT" ]; then
  echo "Usage: $0 <in.mp4> <out.mp4>"
  exit 1
fi
"$FF" -y -display_rotation 0 -i "$IN" \
  -c:a copy -c:v libx264 -pix_fmt yuv420p -crf 16 -preset medium \
  -movflags +faststart \
  "$OUT"
