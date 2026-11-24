import os
import math
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Font paths
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_MONO = "/System/Library/Fonts/Menlo.ttc"
FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def draw_hsrp_plate(draw, x0, y0, x1, y1, plate_text="DL 1C AA 9999"):
    """Draw an authentic Indian High Security Registration Plate (HSRP)."""
    w = x1 - x0
    h = y1 - y0
    
    # White reflective plate with rounded corners
    draw.rounded_rectangle([x0, y0, x1, y1], radius=max(3, int(h * 0.1)), fill=(250, 252, 255), outline=(20, 20, 25), width=max(2, int(h * 0.05)))
    
    # Left blue IND strip
    blue_w = max(10, int(w * 0.12))
    draw.rounded_rectangle([x0, y0, x0 + blue_w, y1], radius=max(2, int(h * 0.08)), fill=(25, 60, 160))
    
    # Small IND text
    font_ind = get_font(FONT_BOLD, max(8, int(h * 0.28)))
    draw.text((x0 + int(blue_w * 0.15), y0 + int(h * 0.35)), "IND", fill=(255, 255, 255), font=font_ind)
    
    # Small chakra circle
    cx = x0 + blue_w // 2
    cy = y0 + int(h * 0.22)
    r = max(2, int(h * 0.1))
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(200, 220, 255), width=1)
    
    # Big bold plate text
    font_plate = get_font(FONT_BOLD, max(12, int(h * 0.72)))
    # Measure text
    text_bbox = draw.textbbox((0, 0), plate_text, font=font_plate)
    tw = text_bbox[2] - text_bbox[0]
    th = text_bbox[3] - text_bbox[1]
    
    tx = x0 + blue_w + ((w - blue_w) - tw) // 2
    ty = y0 + (h - th) // 2 - int(h * 0.05)
    
    # Crisp black characters with high contrast
    draw.text((tx, ty), plate_text, fill=(10, 10, 15), font=font_plate)

def draw_car_front(draw, center_x, center_y, scale, color="White", plate_text="DL 1C AA 9999"):
    """Draw a 3D-perspective SUV approaching the camera."""
    car_w = int(380 * scale)
    car_h = int(270 * scale)
    x0 = center_x - car_w // 2
    y0 = center_y - car_h // 2
    x1 = center_x + car_w // 2
    y1 = center_y + car_h // 2
    
    # Tires / Wheels
    tire_w = int(car_w * 0.18)
    tire_h = int(car_h * 0.3)
    draw.rectangle([x0 - int(car_w * 0.03), y1 - tire_h, x0 + tire_w, y1], fill=(20, 20, 22))
    draw.rectangle([x1 - tire_w, y1 - tire_h, x1 + int(car_w * 0.03), y1], fill=(20, 20, 22))
    # Alloys
    draw.ellipse([x0 + 4, y1 - tire_h + 8, x0 + tire_w - 4, y1 - 4], fill=(70, 75, 80))
    draw.ellipse([x1 - tire_w + 4, y1 - tire_h + 8, x1 - 4, y1 - 4], fill=(70, 75, 80))

    # Car Body (Mahindra Scorpio-N White or Dark)
    body_fill = (242, 245, 248) if color == "White" else (28, 30, 35)
    shadow_fill = (190, 195, 202) if color == "White" else (15, 16, 20)
    
    # Lower bumper shadow
    draw.rounded_rectangle([x0, y0 + int(car_h * 0.45), x1, y1 - int(car_h * 0.05)], radius=int(18 * scale), fill=shadow_fill)
    # Main Body Cabin & Hood
    draw.rounded_rectangle([x0 + int(car_w * 0.08), y0, x1 - int(car_w * 0.08), y0 + int(car_h * 0.55)], radius=int(16 * scale), fill=body_fill)
    draw.rounded_rectangle([x0, y0 + int(car_h * 0.38), x1, y1 - int(car_h * 0.08)], radius=int(22 * scale), fill=body_fill, outline=(80, 85, 95), width=max(1, int(2 * scale)))

    # Roof Rails
    draw.rectangle([x0 + int(car_w * 0.12), y0 - int(car_h * 0.05), x0 + int(car_w * 0.16), y0 + int(car_h * 0.05)], fill=(50, 55, 60))
    draw.rectangle([x1 - int(car_w * 0.16), y0 - int(car_h * 0.05), x1 - int(car_w * 0.12), y0 + int(car_h * 0.05)], fill=(50, 55, 60))

    # Windshield (dark reflective glass with cabin reflection)
    ws_x0 = x0 + int(car_w * 0.14)
    ws_y0 = y0 + int(car_h * 0.06)
    ws_x1 = x1 - int(car_w * 0.14)
    ws_y1 = y0 + int(car_h * 0.36)
    draw.polygon([
        (ws_x0 + int(car_w * 0.05), ws_y0),
        (ws_x1 - int(car_w * 0.05), ws_y0),
        (ws_x1, ws_y1),
        (ws_x0, ws_y1)
    ], fill=(22, 28, 38), outline=(60, 65, 75), width=1)
    
    # Rearview Mirrors
    draw.rounded_rectangle([x0 - int(car_w * 0.07), ws_y1 - int(car_h * 0.08), x0 + int(car_w * 0.02), ws_y1 + int(car_h * 0.05)], radius=4, fill=body_fill)
    draw.rounded_rectangle([x1 - int(car_w * 0.02), ws_y1 - int(car_h * 0.08), x1 + int(car_w * 0.07), ws_y1 + int(car_h * 0.05)], radius=4, fill=body_fill)

    # Front Grille (Aggressive SUV Grille)
    grille_x0 = x0 + int(car_w * 0.22)
    grille_y0 = y0 + int(car_h * 0.42)
    grille_x1 = x1 - int(car_w * 0.22)
    grille_y1 = y0 + int(car_h * 0.68)
    draw.rounded_rectangle([grille_x0, grille_y0, grille_x1, grille_y1], radius=int(6 * scale), fill=(18, 20, 24), outline=(160, 165, 175), width=max(1, int(2 * scale)))
    
    # Grille Chrome Vertical Slats
    slat_count = 6
    slat_step = (grille_x1 - grille_x0) / (slat_count + 1)
    for i in range(1, slat_count + 1):
        sx = int(grille_x0 + i * slat_step)
        draw.line([(sx, grille_y0 + 3), (sx, grille_y1 - 3)], fill=(200, 205, 215), width=max(1, int(2 * scale)))

    # Dual Headlights (LED DRL glow)
    hl_w = int(car_w * 0.17)
    hl_h = int(car_h * 0.16)
    # Left headlight
    draw.rounded_rectangle([x0 + int(car_w * 0.04), grille_y0, x0 + int(car_w * 0.04) + hl_w, grille_y0 + hl_h], radius=4, fill=(240, 248, 255), outline=(100, 110, 120), width=1)
    # Right headlight
    draw.rounded_rectangle([x1 - int(car_w * 0.04) - hl_w, grille_y0, x1 - int(car_w * 0.04), grille_y0 + hl_h], radius=4, fill=(240, 248, 255), outline=(100, 110, 120), width=1)

    # Fog Lights
    fog_r = max(2, int(6 * scale))
    draw.ellipse([x0 + int(car_w * 0.08), y1 - int(car_h * 0.2), x0 + int(car_w * 0.08) + fog_r * 2, y1 - int(car_h * 0.2) + fog_r * 2], fill=(255, 245, 180))
    draw.ellipse([x1 - int(car_w * 0.08) - fog_r * 2, y1 - int(car_h * 0.2), x1 - int(car_w * 0.08), y1 - int(car_h * 0.2) + fog_r * 2], fill=(255, 245, 180))

    # Number Plate Bracket on Front Bumper
    plate_w = int(car_w * 0.54)
    plate_h = int(plate_w * 0.28)
    plate_x0 = center_x - plate_w // 2
    plate_y0 = grille_y1 + int(8 * scale)
    plate_x1 = plate_x0 + plate_w
    plate_y1 = plate_y0 + plate_h

    # Mounting recess
    draw.rectangle([plate_x0 - 4, plate_y0 - 3, plate_x1 + 4, plate_y1 + 3], fill=(12, 14, 18))

    # Draw the authentic razor-sharp HSRP plate
    draw_hsrp_plate(draw, plate_x0, plate_y0, plate_x1, plate_y1, plate_text)

    # Return bounding box of the plate for targeting reticle
    return (plate_x0, plate_y0, plate_x1, plate_y1)

def render_cctv_frame(cam_id, cam_name, frame_idx, total_frames, out_path, plate="DL 1C AA 9999", speed_kmh=86.0):
    w, h = 1280, 720
    img = Image.new("RGB", (w, h), (18, 22, 28))
    draw = ImageDraw.Draw(img)

    # Progress fraction 0.0 to 1.0 (vehicle driving forward towards camera)
    progress = frame_idx / float(total_frames - 1)
    
    # 1. Background Scene (Delhi Road Horizon)
    # Sky
    draw.rectangle([0, 0, w, 280], fill=(24, 30, 42))
    
    # City Horizon / Landmarks
    if "INDIA GATE" in cam_name.upper():
        # India Gate monument silhouette in background
        ig_x = w // 2
        draw.rectangle([ig_x - 60, 160, ig_x + 60, 280], fill=(42, 48, 60))
        draw.rectangle([ig_x - 45, 140, ig_x + 45, 160], fill=(48, 54, 68))
        draw.polygon([(ig_x - 50, 140), (ig_x, 125), (ig_x + 50, 140)], fill=(52, 60, 75))
        # Archway cutout
        draw.rounded_rectangle([ig_x - 22, 210, ig_x + 22, 280], radius=15, fill=(24, 30, 42))
    else:
        # Connaught Place Georgian Classical Pillars & Buildings
        for bx in range(0, w, 140):
            bh = 70 + (bx % 40)
            draw.rectangle([bx, 280 - bh, bx + 120, 280], fill=(36, 42, 54), outline=(48, 56, 70))
            # Windows
            for wy in range(280 - bh + 15, 270, 25):
                for wx in range(bx + 15, bx + 105, 30):
                    draw.rectangle([wx, wy, wx + 14, wy + 16], fill=(200, 180, 100) if (wx + wy) % 5 == 0 else (20, 25, 35))

    # Horizon Line
    draw.line([(0, 280), (w, 280)], fill=(60, 70, 85), width=2)

    # 2. Road Perspective (Asphalt)
    draw.polygon([(0, h), (w, h), (w * 0.65, 280), (w * 0.35, 280)], fill=(32, 36, 42))
    # Curbs & Verges
    draw.polygon([(0, h), (140, h), (w * 0.35, 280), (w * 0.32, 280)], fill=(55, 60, 68))
    draw.polygon([(w - 140, h), (w, h), (w * 0.68, 280), (w * 0.65, 280)], fill=(55, 60, 68))
    
    # Lane divider perspective dashes
    lane_x_start = w // 2
    for d in range(8):
        t0 = (d / 8.0 + progress * 0.25) % 1.0
        t1 = t0 + 0.06
        if t1 > 1.0: continue
        y_a = int(280 + t0 * t0 * (h - 280))
        y_b = int(280 + t1 * t1 * (h - 280))
        x_a = int(w * 0.5 + (t0 - 0.5) * 60)
        x_b = int(w * 0.5 + (t1 - 0.5) * 90)
        draw.line([(x_a, y_a), (x_b, y_b)], fill=(230, 230, 240), width=max(2, int(t1 * 10)))

    # 3. Approaching Vehicle (Scale expands from distance 0.85 to close-up 1.7)
    scale = 0.85 + progress * 0.85
    car_center_x = int(w * 0.52 - progress * 20)
    car_center_y = int(370 + progress * 160)

    # Draw vehicle and get plate coordinates
    plate_bbox = draw_car_front(draw, car_center_x, car_center_y, scale, color="White", plate_text=plate)

    # 4. ANPR AI Targeting Reticle & Tracking Box
    px0, py0, px1, py1 = plate_bbox
    pad = 8
    rx0, ry0, rx1, ry1 = px0 - pad, py0 - pad, px1 + pad, py1 + pad
    
    # Glowing green targeting brackets
    bracket_len = max(8, int(16 * scale))
    green_c = (34, 197, 94) # Tailwind emerald-500
    
    # Top-Left bracket
    draw.line([(rx0, ry0), (rx0 + bracket_len, ry0)], fill=green_c, width=3)
    draw.line([(rx0, ry0), (rx0, ry0 + bracket_len)], fill=green_c, width=3)
    # Top-Right bracket
    draw.line([(rx1, ry0), (rx1 - bracket_len, ry0)], fill=green_c, width=3)
    draw.line([(rx1, ry0), (rx1, ry0 + bracket_len)], fill=green_c, width=3)
    # Bottom-Left bracket
    draw.line([(rx0, ry1), (rx0 + bracket_len, ry1)], fill=green_c, width=3)
    draw.line([(rx0, ry1), (rx0, ry1 - bracket_len)], fill=green_c, width=3)
    # Bottom-Right bracket
    draw.line([(rx1, ry1), (rx1 - bracket_len, ry1)], fill=green_c, width=3)
    draw.line([(rx1, ry1), (rx1 - bracket_len, ry1)], fill=green_c, width=3)

    # Targeting HUD Tag
    hud_font = get_font(FONT_BOLD, 13)
    tag_text = f"ANPR AI LOCK • [{plate}] • RADAR: {speed_kmh:.1f} km/h • CONF: 0.98"
    draw.rectangle([rx0, ry0 - 24, rx0 + 380, ry0 - 2], fill=(10, 20, 15, 220), outline=green_c, width=1)
    draw.text((rx0 + 6, ry0 - 20), tag_text, fill=green_c, font=hud_font)

    # 5. Top Surveillance Header Overlay
    draw.rectangle([0, 0, w, 44], fill=(8, 12, 18, 230))
    draw.line([(0, 44), (w, 44)], fill=(34, 197, 94), width=2)
    
    # Live Red Recording Dot
    draw.ellipse([18, 16, 30, 28], fill=(239, 68, 68))
    
    mono_font = get_font(FONT_BOLD, 15)
    header_text = f"LIVE CCTV • {cam_id} | {cam_name.upper()} | 1080p HD 30FPS"
    draw.text((38, 14), header_text, fill=(240, 245, 255), font=mono_font)

    # Timestamp with incrementing seconds
    sec_offset = int(frame_idx / 30)
    ms_offset = int((frame_idx % 30) * 33.3)
    time_str = f"2026-11-21 20:52:{14 + sec_offset:02d}.{ms_offset:03d} IST"
    if "INDIA GATE" in cam_name.upper():
        time_str = f"2026-11-21 20:53:{52 + sec_offset:02d}.{ms_offset:03d} IST"
        
    ts_font = get_font(FONT_MONO, 14)
    draw.text((w - 320, 14), time_str, fill=(56, 189, 248), font=ts_font)

    # 6. Bottom Corridor Telemetry Bar
    draw.rectangle([0, h - 36, w, h], fill=(8, 12, 18, 220))
    info_font = get_font(FONT_MONO, 12)
    telemetry_str = f"RADAR SENSOR: CALIBRATED | LAT/LON: 28.6328, 77.2197 | HAIL DIJKSTRA TRAVERSAL: PHYSICAL OK | ENCRYPTED LINK: TLS 1.3"
    if "INDIA GATE" in cam_name.upper():
        telemetry_str = f"RADAR SENSOR: CALIBRATED | LAT/LON: 28.6129, 77.2295 | CORRIDOR DIST: 2.34 KM | VELOCITY: {speed_kmh:.1f} KM/H (VIOLATION)"
    draw.text((20, h - 26), telemetry_str, fill=(148, 163, 184), font=info_font)

    img.save(out_path, quality=95)

def generate_video(cam_id, cam_name, output_mp4, plate="DL 1C AA 9999", speed_kmh=86.0):
    tmp_dir = f"/tmp/frames_{cam_id.lower()}"
    os.makedirs(tmp_dir, exist_ok=True)
    total_frames = 75 # 2.5 seconds at 30 fps
    
    print(f"Generating {total_frames} frames for {cam_id}...")
    for idx in range(total_frames):
        frame_file = os.path.join(tmp_dir, f"frame_{idx:04d}.jpg")
        render_cctv_frame(cam_id, cam_name, idx, total_frames, frame_file, plate=plate, speed_kmh=speed_kmh)

    print(f"Encoding {output_mp4} using ffmpeg...")
    cmd = [
        "ffmpeg", "-y",
        "-framerate", "30",
        "-i", os.path.join(tmp_dir, "frame_%04d.jpg"),
        "-c:v", "libx264",
        "-profile:v", "high",
        "-level", "4.0",
        "-pix_fmt", "yuv420p",
        "-b:v", "2500k",
        "-movflags", "+faststart",
        output_mp4
    ]
    subprocess.run(cmd, check=True)
    print(f"Created: {output_mp4} ({os.path.getsize(output_mp4)} bytes)")

if __name__ == "__main__":
    base_pub = "/Users/daksh/.gemini/antigravity/scratch/Car-Number-Plate-Recognition/frontend/public/footage"
    base_dist = "/Users/daksh/.gemini/antigravity/scratch/Car-Number-Plate-Recognition/frontend/dist/footage"
    os.makedirs(base_pub, exist_ok=True)
    os.makedirs(base_dist, exist_ok=True)

    # 1. Camera 1: Connaught Place
    cam1_pub = os.path.join(base_pub, "consecutive_cam01_cp.mp4")
    generate_video("CAM_01", "Connaught Place (Barakhamba)", cam1_pub, plate="DL 1C AA 9999", speed_kmh=84.0)
    
    # 2. Camera 2: India Gate C-Hexagon (Consecutive Arrival 98s later, 2.34 km)
    cam2_pub = os.path.join(base_pub, "consecutive_cam02_indiagate.mp4")
    generate_video("CAM_02", "India Gate C-Hexagon", cam2_pub, plate="DL 1C AA 9999", speed_kmh=86.0)

    # Copy to dist
    subprocess.run(["cp", cam1_pub, os.path.join(base_dist, "consecutive_cam01_cp.mp4")], check=True)
    subprocess.run(["cp", cam2_pub, os.path.join(base_dist, "consecutive_cam02_indiagate.mp4")], check=True)
    print("All consecutive footages generated and deployed to public & dist!")
