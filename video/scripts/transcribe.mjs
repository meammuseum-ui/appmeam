#!/usr/bin/env node
/**
 * Transcribes a video in `public/videos/` into word-timed subtitles using
 * whisper.cpp, and writes the result to `public/captions/<name>.json`.
 *
 * Usage:
 *   node scripts/transcribe.mjs <fileName>   (e.g. clip-1.mp4)
 *
 * The first run downloads the whisper.cpp binary and model into
 * `.whisper-cpp/` (gitignored) — this can take a few minutes.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";

const WHISPER_PATH = path.join(process.cwd(), ".whisper-cpp");
const WHISPER_VERSION = "1.5.5";
// "medium" is a good accuracy/speed tradeoff for Spanish. Use "small" for
// faster (less accurate) results, or "large-v3" for the best quality.
const MODEL = "medium";
const LANGUAGE = "es";

const fileName = process.argv[2];
if (!fileName) {
  console.error("Usage: node scripts/transcribe.mjs <fileName-in-public/videos>");
  process.exit(1);
}

const videoPath = path.join(process.cwd(), "public", "videos", fileName);
if (!fs.existsSync(videoPath)) {
  console.error(`Not found: ${videoPath}`);
  process.exit(1);
}

console.log("Installing whisper.cpp (first run only)...");
await installWhisperCpp({ to: WHISPER_PATH, version: WHISPER_VERSION });

console.log(`Downloading whisper model "${MODEL}" (first run only)...`);
await downloadWhisperModel({ folder: WHISPER_PATH, model: MODEL });

const wavPath = path.join(
  process.cwd(),
  ".whisper-cpp",
  `${path.basename(fileName, path.extname(fileName))}.wav`,
);

console.log("Extracting audio...");
execSync(
  `npx remotion ffmpeg -i "${videoPath}" -ar 16000 -ac 1 "${wavPath}" -y`,
  { stdio: "inherit" },
);

console.log("Transcribing (this can take a while)...");
const transcription = await transcribe({
  inputPath: wavPath,
  whisperPath: WHISPER_PATH,
  whisperCppVersion: WHISPER_VERSION,
  model: MODEL,
  language: LANGUAGE,
  tokenLevelTimestamps: true,
});

const { captions } = toCaptions({ whisperCppOutput: transcription });

const outDir = path.join(process.cwd(), "public", "captions");
fs.mkdirSync(outDir, { recursive: true });
const outName = `${path.basename(fileName, path.extname(fileName))}.json`;
const outPath = path.join(outDir, outName);
fs.writeFileSync(outPath, JSON.stringify(captions, null, 2));

console.log(`Wrote ${captions.length} caption entries to public/captions/${outName}`);
console.log(`Add { fileName: "${fileName}", captionsFile: "${outName}" } to src/clips.ts`);
