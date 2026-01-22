#!/bin/bash
set -e

# Load environment variables from .env.local
export $(grep -v '^#' .env.local | xargs)

# Build with the Google Maps API key
docker build \
  --build-arg NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" \
  -t 100.113.17.63:30500/carolina-crm:latest .

echo "Build complete. Push with: docker push 100.113.17.63:30500/carolina-crm:latest"
