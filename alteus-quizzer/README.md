# Alteus Quizzer

Platformă interactivă de quiz-uri (stil Kahoot) pentru cursurile Alteus.

## Structură Proiect

- `backend/`: API FastAPI + WebSocket server + SQLModel.
- `frontend/`: React app (Vite + ShadCN).
- `docker-compose.yml`: Baza de date PostgreSQL.

## 🚀 Cum pornești aplicația (Mod Console/Developer)

### 1. Baza de Date
Ai nevoie de Docker instalat.
```bash
docker-compose up -d
```
Asta va porni un server PostgreSQL pe portul 5432.

### 2. Backend (Python/FastAPI)
Deschide un terminal nou:
```bash
cd backend

# Setup virtual environment
python3 -m venv venv
source venv/bin/activate  # Pe Windows: venv\Scripts\activate

# Instalare dependențe
pip install -r requirements.txt

# Pornire server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Serverul API va fi disponibil la `http://localhost:8000`.
Documentația automată (Swagger): `http://localhost:8000/docs`.

**Notă:** Asigură-te că ai fișierul `.env` în `backend/` (vezi `.env.example`).

### 3. Frontend (React)
Deschide un alt terminal:
```bash
cd frontend

# Instalare dependențe
npm install

# Pornire server development
npm run dev
```
Aplicația va fi disponibilă la `http://localhost:5173`.

## 🎮 Flow Utilizare

1. **Admin:**
   - Accesează `http://localhost:8000/docs` și creează un Quiz folosind endpoint-ul `POST /quizzes/`.
   - Sau folosește interfața de admin (dacă este implementată complet) pentru a crea quiz-uri.

2. **Host:**
   - Generează o sesiune (prin API `POST /sessions/?quiz_id=1`).
   - Accesează pagina de Host din frontend cu codul sesiunii.

3. **Participant:**
   - Intră pe prima pagină, introduce Codul Sesiunii și Numele.
   - Așteaptă startul jocului.

## Tehnologii
- **Backend:** FastAPI, SQLModel, PostgreSQL, AsyncPG, WebSockets.
- **Frontend:** React, Zustand, TailwindCSS, ShadCN UI.

