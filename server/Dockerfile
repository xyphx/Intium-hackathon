# Use official Python runtime as a parent image
FROM python:3.11-slim AS backend_builder

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY server/requirements.txt .

# Install dependencies explicitly without cache for smaller image size
RUN pip install --no-cache-dir -r requirements.txt

# Copy the server directory contents to the root /app
COPY server/ ./

# Copy the Cloud AI module (needed for backend execution)
COPY ai/ ./ai/

# Ensure Python can find the 'ai' module as an absolute import
ENV PYTHONPATH=/app

# Expose the backend port
EXPOSE 8000

# Run the FastAPI server using Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
