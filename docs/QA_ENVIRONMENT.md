# Crusaders ANPR — QA Environment & Testing Guide

## 1. Overview
The QA environment is isolated from production to ensure deterministic testing without risking contamination of production surveillance data.

## 2. Key Components
- **Isolated SQLite Database**: `backend/crusaders_qa.db` (separated from `crusaders.db`).
- **Authoritative Camera Registry**: `backend/camera_registry.py` acts as the single source of truth for all camera metadata and GPS coordinates.
- **Deterministic Seed Fixtures**: Seeded automatically by `backend/qa_config.py`.

## 3. Environment Setup & Reset Commands

### Initialize or Reset QA Database:
```bash
python3 -c "from backend.qa_config import init_qa_database; init_qa_database()"
```

### Run Full Test Suite (Smoke, Regression Matrix, Governance):
```bash
pytest backend/tests -v
```

### Run Production Smoke Tests:
```bash
pytest backend/tests/test_smoke.py -v
```

### Run 250-Case Filter Matrix:
```bash
pytest backend/tests/test_regression_ci.py -v
```
