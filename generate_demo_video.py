"""
CHOG969 Demo Video Generator
Voiceover: en-US-ChristopherNeural (deep, natural)
Output: chog969_submission_demo.mp4 (submission only — not for repo)
"""

import asyncio
import os
import sys
import tempfile
import textwrap
from pathlib import Path

# ── paths ────────────────────────────────────────────────────────────────────
BASE = Path(r"C:\Users\user\Documents\chogathon")
UPLOADED = Path(r"C:\Users\user\.gemini\antigravity\brain\04471c07-3350-4911-85bd-ad3c741da1eb\.user_uploaded")
OUTPUT = BASE / "chog969_submission_demo.mp4"
TMP = Path(tempfile.mkdtemp())

# ── ffmpeg ────────────────────────────────────────────────────────────────────
import imageio_ffmpeg
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
print(f"[ffmpeg] {FFMPEG}")

# ── edge-tts ──────────────────────────────────────────────────────────────────
import edge_tts

VOICE = "en-US-ChristopherNeural"

# ── script ────────────────────────────────────────────────────────────────────
# Each entry: (text, image_path)
SCENES = [
    (
        "Welcome to CHOG 969 — The Living Cartridge Arcade. "
        "A fully on-chain arcade experience built on Monad, where your NFT isn't just a profile picture — it's your fighter.",
        UPLOADED / "media_1792753562647_1d0d2a98.png",   # homepage
    ),
    (
        "Connect your wallet, pick your Chog NFT, and enter the arena. "
        "Common, Rare, Epic, or Legendary — every tier faces the same brutal enemies, "
        "but higher-tier Chogs hit harder, shield more, and earn significantly bigger CHOG token rewards.",
        UPLOADED / "media_1792750256681_79a3e4b0.png",   # NFT select / tier screen
    ),
    (
        "The combat is real-time and relentless. Dodge waves of alien enemies, "
        "unleash powered attacks, and chase the high score before the clock runs out. "
        "Every session is different — every second counts.",
        UPLOADED / "media_1792416065606_3e1ea72e.png",   # gameplay combat
    ),
    (
        "Winning isn't just bragging rights. "
        "A live smart-contract vault on Monad Mainnet holds real CHOG tokens. "
        "Top players earn direct on-chain payouts — fully transparent, fully decentralised.",
        UPLOADED / "media_1792751827418_b289c974.png",   # vault page
    ),
    (
        "And it works on every device. On mobile, twin-thumb floating joystick controls "
        "and smart auto-aim make the arcade feel native — whether you're on a phone, tablet, or desktop. "
        "No compromise. Pure arcade.",
        UPLOADED / "media_1792760654149_2f66e1cd.jpg",   # mobile screenshot 1
    ),
    (
        "The action is just as tight on any screen size. "
        "Ergonomic button layout, instant response, and a game that was designed to be played — not just looked at.",
        UPLOADED / "media_1792760654170_acedbb34.jpg",   # mobile screenshot 2
    ),
    (
        "CHOG 969 — The Living Cartridge Arcade. "
        "Real NFTs. Real rewards. Real arcade energy. "
        "Built on Monad. Built to win.",
        UPLOADED / "media_1792753562647_1d0d2a98.png",   # homepage outro
    ),
]

# ── helpers ───────────────────────────────────────────────────────────────────
def run(cmd: list[str], label=""):
    import subprocess
    print(f"[run] {label or cmd[0]}")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stdout[-2000:])
        print(r.stderr[-2000:])
        raise RuntimeError(f"Command failed: {cmd[0]}")
    return r


async def synthesize(text: str, out_path: Path):
    comm = edge_tts.Communicate(text, VOICE, rate="+5%", pitch="+0Hz")
    await comm.save(str(out_path))
    print(f"  [tts] saved → {out_path.name}")


def make_scene_video(img_path: Path, audio_path: Path, out_path: Path):
    """Combine still image + audio into a video clip with fade-in/out."""
    # Get audio duration
    import subprocess, json
    probe = subprocess.run(
        [FFMPEG.replace("ffmpeg", "ffprobe").replace("ffmpeg-win-x86_64-v7.1", "ffprobe-win-x86_64-v7.1")
         if "ffprobe" in FFMPEG else FFMPEG,
         "-v", "quiet", "-print_format", "json", "-show_format", str(audio_path)],
        capture_output=True, text=True
    )
    # ffprobe may not be separately available — use ffmpeg to get duration
    probe2 = subprocess.run(
        [FFMPEG, "-i", str(audio_path), "-f", "null", "-"],
        capture_output=True, text=True
    )
    duration = 5.0
    for line in probe2.stderr.splitlines():
        if "Duration" in line:
            parts = line.strip().split("Duration:")[1].split(",")[0].strip()
            h, m, s = parts.split(":")
            duration = float(h)*3600 + float(m)*60 + float(s)
            break
    duration += 0.5  # small tail

    run([
        FFMPEG, "-y",
        "-loop", "1", "-i", str(img_path),
        "-i", str(audio_path),
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-vf", (
            f"scale=1920:1080:force_original_aspect_ratio=decrease,"
            f"pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,"
            f"format=yuv420p,"
            f"fade=t=in:st=0:d=0.4,fade=t=out:st={duration-0.5:.2f}:d=0.4"
        ),
        "-c:a", "aac", "-b:a", "192k",
        "-t", str(duration),
        "-shortest",
        str(out_path),
    ], f"scene → {out_path.name}")


def concat_clips(clip_paths: list[Path], out_path: Path):
    list_file = TMP / "concat.txt"
    with open(list_file, "w") as f:
        for p in clip_paths:
            f.write(f"file '{p}'\n")
    run([
        FFMPEG, "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(list_file),
        "-c", "copy",
        str(out_path),
    ], "concat")


# ── main ──────────────────────────────────────────────────────────────────────
async def main():
    print("=" * 60)
    print("CHOG969 Demo Video Generator")
    print("=" * 60)

    clip_paths = []

    for i, (text, img) in enumerate(SCENES):
        print(f"\n--- Scene {i+1}/{len(SCENES)} ---")
        if not Path(img).exists():
            print(f"  [WARN] image not found: {img} — skipping scene")
            continue

        audio_path = TMP / f"audio_{i:02d}.mp3"
        clip_path  = TMP / f"clip_{i:02d}.mp4"

        # TTS
        await synthesize(text, audio_path)

        # Video clip
        make_scene_video(Path(img), audio_path, clip_path)
        clip_paths.append(clip_path)

    if not clip_paths:
        print("[ERROR] No clips were generated!")
        sys.exit(1)

    # Concatenate
    print(f"\n--- Concatenating {len(clip_paths)} clips ---")
    concat_clips(clip_paths, OUTPUT)

    size_mb = OUTPUT.stat().st_size / 1_048_576
    print(f"\n✅ Done! → {OUTPUT}  ({size_mb:.1f} MB)")
    print("   (This file is for submission only — do NOT push to git.)")


asyncio.run(main())
