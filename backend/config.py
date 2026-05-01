import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()
BASE_DIR = Path(__file__).resolve().parent

DATABASE_URL   = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/assurance_auto.db")
API_HOST       = os.getenv("API_HOST", "0.0.0.0")
API_PORT       = int(os.getenv("API_PORT", 8000))
SECRET_KEY     = os.getenv("SECRET_KEY", "PI_ASSURANCE_SECRET_KEY_CHANGE_IN_PROD_2024")
ALGORITHM      = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24))
DATA_PATH      = os.getenv("DATA_PATH", str(BASE_DIR / "data" / "motor_insurance.csv"))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "")
ROBOFLOW_PROJECT = os.getenv("ROBOFLOW_PROJECT", "car-damage-detection")
ROBOFLOW_VERSION = int(os.getenv("ROBOFLOW_VERSION", 1))
APP_MODE       = os.getenv("APP_MODE", "demo")
