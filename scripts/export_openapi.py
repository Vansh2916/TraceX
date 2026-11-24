#!/usr/bin/env python3
"""
Exports OpenAPI JSON schema from the FastAPI application.
"""
import json
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
try:
    from backend.main import app
    schema = app.openapi()
    output_path = os.path.join(os.path.dirname(__file__), "..", "docs", "openapi.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2)
    print(f"[✓] Successfully exported OpenAPI specification to {output_path}")
except Exception as e:
    print(f"[!] Note: Could not import app directly ({e}), skipping schema export.")
