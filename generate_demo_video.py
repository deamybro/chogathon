import os
import subprocess
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

# Video Specs
WIDTH = 1920
HEIGHT = 1080
FPS = 30
TOTAL_SECONDS = 64
TOTAL_FRAMES = TOTAL_SECONDS * FPS

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

# Sources
IMG_HOME = r"C:/Users/user/.gemini/antigravity/brain/04471c07-3350-4911-85bd-ad3c741da1eb/.user_uploaded/media_1792753562647_1d0d2a98.png"
IMG_COMBAT = r"C:/Users/user/.gemini/antigravity/brain/04471c07-3350-4911-85bd-ad3c741da1eb/.user_uploaded/media_1792416065606_3e1ea72e.png"
IMG_BOSS = r"public/images/chogathon_boss_dialogue.jpg"
IMG_VAULT = r"C:/Users/user/.gemini/antigravity/brain/04471c07-3350-4911-85bd-ad3c741da1eb/.user_uploaded/media_1792751827418_b289c974.png"
AUDIO_PATH = r"public/voiceover.mp3"
OUTPUT_VIDEO = r"public/chog969_demo_showcase.mp4"

# Timeline segments (seconds)
# 0.0 - 11.5s: Hook & Arcade Lobby
# 11.5 - 24.5s: Living Cartridge Concept
# 24.5 - 39.0s: High-Octane Combat & Void Colossus Encounter
# 39.0 - 54.0s: Live Monad Mainnet Vault & 400 $CHOG Bounties
# 54.0 - 64.0s: Hackathon Judge Solo Play & Call To Action
SEGMENTS = [
    {
        "start": 0.0,
        "end": 11.5,
        "img": IMG_HOME,
        "tag": "OFFICIAL MONAD HACKATHON DEMO",
        "title": "CHOG 969: THE LIVING CARTRIDGE ARCADE",
        "subtitle": "What if your NFT wasn't a static JPEG, but the entire living game cartridge?",
        "badge": "MONAD MAINNET",
        "badge_color": "#22c55e"
    },
    {
        "start": 11.5,
        "end": 24.5,
        "img": IMG_HOME,
        "tag": "DETERMINISTIC ON-CHAIN GENERATION",
        "title": "PLUG IN ANY CHOG • SURVIVE ITS DREAM",
        "subtitle": "Metadata traits compile biome physics, weapons, abilities & wave escalation.",
        "badge": "100% DETERMINISTIC",
        "badge_color": "#a855f7"
    },
    {
        "start": 24.5,
        "end": 39.0,
        "img": IMG_BOSS,
        "tag": "RETRO ARCADE GAMEPLAY & BOSS TRANSMISSION",
        "title": "60-SECOND ESCALATING WAVE SURVIVAL",
        "subtitle": "Trigger Aegis Royal Shields, collect skill drops & battle sector dreadnoughts.",
        "badge": "PHASER 3 ENGINE",
        "badge_color": "#38bdf8"
    },
    {
        "start": 39.0,
        "end": 54.0,
        "img": IMG_VAULT,
        "tag": "DEPLOYED ON MONAD MAINNET",
        "title": "400 $CHOG BOUNTY VAULT • REAL REWARDS",
        "subtitle": "Cleared sectors earn real on-chain bounties. Higher tiers earn up to 3.8x!",
        "badge": "VERIFIED SMART CONTRACT",
        "badge_color": "#facc15"
    },
    {
        "start": 54.0,
        "end": 64.0,
        "img": IMG_COMBAT,
        "tag": "SOLO JUDGE INSTANT ACCESS",
        "title": "ZERO GAS • NO WAITING • PLAYABLE NOW",
        "subtitle": "Chog 969: Plug in your Chog. Survive its dream. Live on Monad.",
        "badge": "READY FOR JUDGING",
        "badge_color": "#22c55e"
    }
]

print("Preparing fonts and canvas...")
try:
    font_large = ImageFont.truetype("arialbd.ttf", 46)
    font_med = ImageFont.truetype("arialbd.ttf", 28)
    font_tag = ImageFont.truetype("arialbd.ttf", 22)
    font_sub = ImageFont.truetype("arial.ttf", 30)
except:
    font_large = ImageFont.load_default()
    font_med = ImageFont.load_default()
    font_tag = ImageFont.load_default()
    font_sub = ImageFont.load_default()

# Pre-load and scale images to fit 1920x840 (leaving room for top header and bottom captions)
loaded_images = {}
for seg in SEGMENTS:
    p = seg["img"]
    if p not in loaded_images and os.path.exists(p):
        raw = Image.open(p).convert("RGBA")
        # Scale keeping aspect ratio
        target_w = 1720
        target_h = 760
        raw.thumbnail((target_w, target_h), Image.Resampling.LANCZOS)
        loaded_images[p] = raw

# Open FFmpeg pipe for streaming frames
cmd = [
    ffmpeg,
    "-y",
    "-f", "rawvideo",
    "-vcodec", "rawvideo",
    "-s", f"{WIDTH}x{HEIGHT}",
    "-pix_fmt", "rgb24",
    "-r", str(FPS),
    "-i", "-",
    "-i", AUDIO_PATH,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    OUTPUT_VIDEO
]

print("Launching FFmpeg encoder...")
proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

for f_idx in range(TOTAL_FRAMES):
    t = f_idx / FPS
    # Determine current segment
    curr = SEGMENTS[-1]
    for seg in SEGMENTS:
        if seg["start"] <= t < seg["end"]:
            curr = seg
            break

    # Base background (Dark sci-fi slate #090d16)
    frame = Image.new("RGB", (WIDTH, HEIGHT), (9, 13, 22))
    draw = ImageDraw.Draw(frame)

    # Top Header Bar
    draw.rectangle([(0, 0), (WIDTH, 110)], fill=(13, 19, 33))
    draw.line([(0, 110), (WIDTH, 110)], fill=(34, 197, 94), width=3)

    # Tag and Title in Top Bar
    draw.text((70, 20), curr["tag"], font=font_tag, fill=(34, 197, 94))
    draw.text((70, 52), curr["title"], font=font_large, fill=(255, 255, 255))

    # Badge Pill (Top Right)
    badge_text = curr["badge"]
    badge_w = 280
    badge_h = 48
    bx = WIDTH - 70 - badge_w
    by = 32
    draw.rounded_rectangle([(bx, by), (bx + badge_w, by + badge_h)], radius=12, fill=(20, 27, 45), outline=(34, 197, 94), width=2)
    draw.text((bx + 20, by + 12), badge_text, font=font_med, fill=(34, 197, 94))

    # Center Image Display
    img_asset = loaded_images.get(curr["img"])
    if img_asset:
        iw, ih = img_asset.size
        # Center in (WIDTH, 840) area starting at y=130
        center_x = (WIDTH - iw) // 2
        center_y = 130 + (780 - ih) // 2
        # Draw soft glow box around asset
        draw.rectangle([(center_x - 6, center_y - 6), (center_x + iw + 6, center_y + ih + 6)], outline=(56, 189, 248), width=2)
        frame.paste(img_asset, (center_x, center_y), img_asset)

    # Bottom Subtitle / Captions Bar (Glass-style dark container)
    sub_y = HEIGHT - 130
    draw.rectangle([(0, sub_y), (WIDTH, HEIGHT)], fill=(10, 15, 26))
    draw.line([(0, sub_y), (WIDTH, sub_y)], fill=(56, 189, 248), width=2)

    # Animated glowing dot
    dot_color = (34, 197, 94) if (f_idx // 15) % 2 == 0 else (56, 189, 248)
    draw.ellipse([(65, sub_y + 45), (85, sub_y + 65)], fill=dot_color)

    # Subtitle text
    draw.text((105, sub_y + 40), curr["subtitle"], font=font_sub, fill=(240, 246, 252))

    # Progress Bar at bottom of screen
    progress = f_idx / TOTAL_FRAMES
    draw.rectangle([(0, HEIGHT - 8), (int(WIDTH * progress), HEIGHT)], fill=(34, 197, 94))

    # Pipe RGB bytes to FFmpeg
    proc.stdin.write(frame.tobytes())

    if f_idx % 150 == 0:
        print(f"Rendered frame {f_idx}/{TOTAL_FRAMES} ({(progress*100):.1f}%)")

proc.stdin.close()
proc.wait()
print("Demo video generation complete! Saved to:", OUTPUT_VIDEO)
