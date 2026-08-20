FROM python:3.11-slim

WORKDIR /app

COPY server/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy server code
COPY server/ .

# Copy AI module
COPY ai/ /app/ai/

# Add app directory to PYTHONPATH so it can import ai
ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
