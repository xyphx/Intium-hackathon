# Development Stage (Hackathon Mode)
FROM node:20-alpine

WORKDIR /app

# Copy package management files
COPY package.json package-lock.json ./

# Install dependencies cleanly
RUN npm ci

# Copy the rest of the application
COPY . .

# Accept build arguments for environment variables
ARG VITE_API_URL
ARG VITE_WS_URL

# Set environment variables
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV HOST=0.0.0.0

# Expose Vite's default dev port or 80
# The docker-compose maps 3000:80, so let's run vite on port 80
EXPOSE 80

# Start the Vite dev server on port 80
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "80"]
