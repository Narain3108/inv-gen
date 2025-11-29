@echo off
echo Installing dependencies...
pip install -r Backend/requirements.txt

echo.
echo Starting Backend Server...
cd Backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
cd ..
