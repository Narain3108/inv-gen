import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Google Sheets
    GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")
    SPREADSHEET_ID = os.getenv("SPREADSHEET_ID")
    WORKSHEET_NAME = os.getenv("WORKSHEET_NAME", "Sheet1")

    # GitHub
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    GITHUB_REPO = os.getenv("GITHUB_REPO")
    
    @classmethod
    def validate(cls):
        missing = []
        if not cls.SPREADSHEET_ID:
            missing.append("SPREADSHEET_ID")
        if not cls.GITHUB_TOKEN:
            missing.append("GITHUB_TOKEN")
        if not cls.GITHUB_REPO:
            missing.append("GITHUB_REPO")
            
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
