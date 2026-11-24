#!/usr/bin/env python3
"""
CLI Tool to Trigger Live Hackathon Scenarios.
Usage: python scripts/run_demo_scenario.py --scenario [ghost|convoy]
"""
import argparse
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.demo_simulator import generate_ghost_vehicle_scenario, generate_convoy_scenario

def main():
    parser = argparse.ArgumentParser(description="Trigger TraceX live demo scenarios")
    parser.add_argument("--scenario", choices=["ghost", "convoy"], default="ghost", help="Scenario to emit")
    args = parser.parse_args()

    if args.scenario == "ghost":
        events = generate_ghost_vehicle_scenario()
        print(f"[*] Generated Ghost Vehicle Teleportation Scenario ({len(events)} events):")
        for e in events:
            print(f"    - [{e['camera_id']}] Plate: {e['plate_number']} @ {e['timestamp_sec']}")
    else:
        events = generate_convoy_scenario()
        print(f"[*] Generated Convoy Surveillance Scenario ({len(events)} events):")
        for e in events:
            print(f"    - [{e['camera_id']}] Plate: {e['plate_number']} (+{e['timestamp_sec']}s)")

if __name__ == "__main__":
    main()
