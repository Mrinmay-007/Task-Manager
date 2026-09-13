python -m venv venv

Set-ExecutionPolicy RemoteSigned -Scope Process
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload

pip install -r requirements.txt