# Open Layer Observability Platform — Production Deployment Guide

## 1. Architecture & Deployment Strategy

Open Layer is built with a decoupled architecture designed for high availability, minimal operational overhead, and cost efficiency:

- **Frontend**: Single Page Application (React 18 + Vite) designed for zero-maintenance edge deployment on **Vercel** or **Netlify**.
- **Backend**: Asynchronous REST API (FastAPI + SQLAlchemy) suitable for lightweight container deployment (**Render**, **Railway**, **Fly.io**, or **Docker**).
- **Database**:
  - **Local / Test / Free Tier**: Embedded SQLite (`sqlite:///./open_layer.db`) requiring zero external services.
  - **Production Scaled**: Managed MySQL 8.0 or PostgreSQL 15+ (e.g. AWS RDS, Supabase, Neon, or PlanetScale).

---

## 2. Frontend Deployment to Vercel

The frontend includes a pre-configured `vercel.json` file providing SPA route rewriting so that all sub-paths resolve cleanly to `index.html`.

### Step-by-Step Vercel Deployment:

1. **Push your code to GitHub**:
   Ensure the `open_layer_observability` project is pushed to your GitHub repository.

2. **Import into Vercel**:
   - Log into the [Vercel Dashboard](https://vercel.com).
   - Click **"Add New..."** -> **"Project"**.
   - Select your GitHub repository.

3. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (or `open_layer_observability/frontend` depending on repository root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Set Environment Variables**:
   In the Vercel project settings, add the following environment variable:
   ```env
   VITE_API_URL=https://your-backend-api.onrender.com/api
   ```
   *(Replace with the public HTTPS URL of your deployed backend).*

5. **Deploy**:
   Click **"Deploy"**. Vercel will build the frontend and serve it globally across edge locations.

---

## 3. Backend Deployment Options

### Option A: Render (Recommended for Low/Zero-Cost Hosting)

Render provides native support for Python web services and Docker containers.

1. **Create a New Web Service**:
   - In Render, click **"New +"** -> **"Web Service"**.
   - Connect your GitHub repository.

2. **Configure Settings**:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Configure Environment Variables**:
   ```env
   APP_NAME=Open Layer Observability API
   API_PREFIX=/api
   DATABASE_URL=sqlite:///./open_layer.db
   SECRET_KEY=generate_a_secure_random_64_character_hex_string_here
   ACCESS_TOKEN_MINUTES=120
   CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
   SEED_DEMO_DATA=true
   ```

4. **Verify Health**:
   Once deployed, navigate to `https://your-render-url.onrender.com/health` to confirm the API is active.

---

### Option B: Docker Container Deployment

The backend contains a production-ready `Dockerfile`:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
EXPOSE 8000
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]
```

#### Build and Run Locally:
```bash
cd backend
docker build -t open-layer-backend .
docker run -d -p 8000:8000 \
  -e DATABASE_URL=sqlite:///./open_layer.db \
  -e CORS_ORIGINS=http://localhost:5173 \
  -e SECRET_KEY=your-production-secret-key \
  --name open-layer-api \
  open-layer-backend
```

---

### Option C: Docker Compose (Full-Stack Local / VPS)

To launch both frontend and backend together:
```bash
docker compose up -d --build
```
This starts:
- Frontend on `http://localhost:5173`
- Backend API on `http://localhost:8000`

---

## 4. Production Database Configuration

### Using Cloud PostgreSQL (e.g. Supabase or Neon):
1. Create a free PostgreSQL database on Supabase or Neon.
2. In your backend environment settings, provide the connection string:
   ```env
   DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@ep-xyz.neon.tech/open_layer?sslmode=require
   ```
3. Add `psycopg2-binary` to `backend/requirements.txt` if deploying PostgreSQL.

### Using Cloud MySQL (e.g. AWS RDS or PlanetScale):
1. Create a MySQL 8.0 instance.
2. Set the connection string:
   ```env
   DATABASE_URL=mysql+pymysql://open_layer_user:YOUR_PASSWORD@db-host:3306/open_layer?charset=utf8mb4
   ```
3. `pymysql` is already included in `requirements.txt`.

---

## 5. Security & Production Checklist

Before pointing production traffic to Open Layer:

- [x] **Replace `SECRET_KEY`**: Generate a cryptographically secure random string with `python -c "import secrets; print(secrets.token_hex(32))"`.
- [x] **Configure Strict CORS**: Set `CORS_ORIGINS` to the exact production domain(s) of the frontend (e.g. `https://open-layer.vercel.app`).
- [x] **Enforce HTTPS**: Ensure all backend API traffic is served over TLS/HTTPS.
- [x] **Disable Demo Seeding in Real Production**: Set `SEED_DEMO_DATA=false` once initial administrative users are established.
- [x] **Change Default Passwords**: Change the default passwords for the seeded roles (`admin`, `sre`, `devops`, `developer`, `viewer`).
- [x] **Monitor Ingestion Rates**: For high-volume log ingestion, place an API rate limiter or message queue (Redis/Kafka) in front of the `/api/logs` endpoint.
