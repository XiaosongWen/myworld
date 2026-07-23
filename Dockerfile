# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Unified Production Runtime (Backend + Static Frontend)
FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend source code
COPY backend ./backend

# Copy static frontend assets built in Stage 1
COPY --from=frontend-builder /app/frontend/dist ./backend/static

# Set up entrypoint execution permissions
RUN chmod +x ./backend/entrypoint.sh

WORKDIR /app/backend

EXPOSE 8000

CMD ["./entrypoint.sh"]
