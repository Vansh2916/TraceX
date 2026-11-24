import os
import subprocess

def prepare_real_streams():
    base_pub = "/Users/daksh/.gemini/antigravity/scratch/Car-Number-Plate-Recognition/frontend/public/footage"
    base_dist = "/Users/daksh/.gemini/antigravity/scratch/Car-Number-Plate-Recognition/frontend/dist/footage"
    os.makedirs(base_pub, exist_ok=True)
    os.makedirs(base_dist, exist_ok=True)

    scale_filter = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2"

    # Cam 1: Real Indian Traffic Camera with Red Hyundai Car (AP 10 AR 0558)
    cam1_target = os.path.join(base_pub, "consecutive_cam01_cp.mp4")
    cmd1 = [
        "ffmpeg", "-y",
        "-ss", "00:00:00",
        "-t", "00:00:06",
        "-i", "/tmp/raw_anpr_1.webm",
        "-vf", scale_filter,
        "-c:v", "libx264",
        "-profile:v", "main",
        "-pix_fmt", "yuv420p",
        "-an",
        "-movflags", "+faststart",
        cam1_target
    ]
    subprocess.run(cmd1, check=True)
    print("CAM_01 real CCTV stream prepared!")

    # Cam 2: Real Indian Traffic Camera Consecutive Arrival (India Gate C-Hexagon)
    cam2_target = os.path.join(base_pub, "consecutive_cam02_indiagate.mp4")
    cmd2 = [
        "ffmpeg", "-y",
        "-ss", "00:00:02",
        "-t", "00:00:06",
        "-i", "/tmp/raw_anpr_1.webm",
        "-vf", scale_filter,
        "-c:v", "libx264",
        "-profile:v", "main",
        "-pix_fmt", "yuv420p",
        "-an",
        "-movflags", "+faststart",
        cam2_target
    ]
    subprocess.run(cmd2, check=True)
    print("CAM_02 real CCTV stream prepared!")

    # Cam 3: Real Expressway Traffic CCTV (Dhaula Kuan NH-48)
    cam3_target = os.path.join(base_pub, "car-detection.mp4")
    cmd3 = [
        "ffmpeg", "-y",
        "-ss", "00:00:10",
        "-t", "00:00:08",
        "-i", "/tmp/lpr_sysvideo.mkv",
        "-vf", scale_filter,
        "-c:v", "libx264",
        "-profile:v", "main",
        "-pix_fmt", "yuv420p",
        "-an",
        "-movflags", "+faststart",
        cam3_target
    ]
    subprocess.run(cmd3, check=True)
    print("CAM_06 real CCTV stream prepared!")

    # Copy all to dist
    subprocess.run(["cp", cam1_target, os.path.join(base_dist, "consecutive_cam01_cp.mp4")], check=True)
    subprocess.run(["cp", cam2_target, os.path.join(base_dist, "consecutive_cam02_indiagate.mp4")], check=True)
    subprocess.run(["cp", cam3_target, os.path.join(base_dist, "car-detection.mp4")], check=True)
    print("All real CCTV footage deployed to dist!")

if __name__ == "__main__":
    prepare_real_streams()
