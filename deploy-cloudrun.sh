#!/usr/bin/env bash
# ==============================================================================
# ContextForge: Google Cloud Run (Always Free Tier) Deployment Script
# ==============================================================================
# Features:
# - Single Fullstack Container (Vite/React UI + NestJS API on 1 Cloud Run URL)
# - Scale to 0 (Zero Idle Cost, 100% Free Quota Compliant)
# - CPU Throttling (CPU allocated only during active requests)
# - 512MiB RAM & 1 vCPU
# - us-central1 region (includes 1GB free internet egress)
# ==============================================================================

set -e

# ANSI Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   ContextForge Google Cloud Run Deployment Setup   ${NC}"
echo -e "${BLUE}   Mode: Single-Container Always-Free Compliant     ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Check gcloud CLI
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: Google Cloud SDK (gcloud) is not installed.${NC}"
    echo -e "Please install gcloud from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# 2. Detect / Set GCP Project ID
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$CURRENT_PROJECT" ]; then
    echo -e "${YELLOW}⚠️ No active GCP project configured in gcloud.${NC}"
    read -p "Enter your GCP Project ID: " GCP_PROJECT_ID
    gcloud config set project "$GCP_PROJECT_ID"
else
    echo -e "${GREEN}✓ Using active GCP Project: ${CURRENT_PROJECT}${NC}"
    read -p "Press ENTER to use this project or type a new Project ID: " INPUT_PROJECT
    if [ -n "$INPUT_PROJECT" ]; then
        GCP_PROJECT_ID="$INPUT_PROJECT"
        gcloud config set project "$GCP_PROJECT_ID"
    else
        GCP_PROJECT_ID="$CURRENT_PROJECT"
    fi
fi

# 3. Target Configuration
SERVICE_NAME="contextforge"
REGION="us-central1"

# 4. Read Environment Variables from backend/.env if available
BACKEND_ENV_FILE="backend/.env"
if [ -f "$BACKEND_ENV_FILE" ]; then
    echo -e "${GREEN}✓ Reading configuration from ${BACKEND_ENV_FILE}...${NC}"
    SUPABASE_DB_URL=$(grep "^DATABASE_URL=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    GEMINI_KEY=$(grep "^GEMINI_API=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    TIMEZONE=$(grep "^DEFAULT_TIMEZONE=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "Asia/Jakarta")
    NOTION_ID=$(grep "^NOTION_CLIENT_ID=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    NOTION_SECRET=$(grep "^NOTION_CLIENT_SECRET=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    NOTION_KEY=$(grep "^NOTION_API_KEY=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    GOOGLE_ID=$(grep "^GOOGLE_CLIENT_ID=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    GOOGLE_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
else
    echo -e "${YELLOW}⚠️ backend/.env file not found, using default values.${NC}"
fi

# Fallback prompts if missing
if [ -z "$SUPABASE_DB_URL" ]; then
    read -p "Enter Supabase DATABASE_URL: " SUPABASE_DB_URL
fi

if [ -z "$GEMINI_KEY" ]; then
    read -p "Enter Google Gemini API Key: " GEMINI_KEY
fi

# 5. Enable Required Google Cloud APIs
echo -e "\n${BLUE}⏳ Ensuring required Google Cloud APIs are enabled...${NC}"
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    --project="$GCP_PROJECT_ID"

# 6. Build and Deploy directly via Cloud Run Source Build
echo -e "\n${BLUE}🚀 Building and deploying ContextForge to Cloud Run (Region: ${REGION})...${NC}"
echo -e "${YELLOW}Flags: --min-instances=0 --max-instances=2 --cpu-throttling --memory=512Mi --cpu=1${NC}\n"

ENV_VARS="NODE_ENV=production,DATABASE_URL=${SUPABASE_DB_URL},GEMINI_API=${GEMINI_KEY},DEFAULT_TIMEZONE=${TIMEZONE:-Asia/Jakarta},GEMINI_DEFAULT_MODEL=gemini-3.5-flash-lite,GEMINI_EMBEDDING_MODEL=gemini-embedding-2,GEMINI_EMBEDDING_DIMENSION=1536"

if [ -n "$NOTION_ID" ]; then ENV_VARS="${ENV_VARS},NOTION_CLIENT_ID=${NOTION_ID}"; fi
if [ -n "$NOTION_SECRET" ]; then ENV_VARS="${ENV_VARS},NOTION_CLIENT_SECRET=${NOTION_SECRET}"; fi
if [ -n "$NOTION_KEY" ]; then ENV_VARS="${ENV_VARS},NOTION_API_KEY=${NOTION_KEY}"; fi
if [ -n "$GOOGLE_ID" ]; then ENV_VARS="${ENV_VARS},GOOGLE_CLIENT_ID=${GOOGLE_ID}"; fi
if [ -n "$GOOGLE_SECRET" ]; then ENV_VARS="${ENV_VARS},GOOGLE_CLIENT_SECRET=${GOOGLE_SECRET}"; fi

gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --project="$GCP_PROJECT_ID" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=2 \
    --cpu-throttling \
    --concurrency=80 \
    --timeout=300 \
    --set-env-vars="$ENV_VARS"

echo -e "\n${GREEN}========================================================${NC}"
echo -e "${GREEN}🎉 CONTEXTFORGE DEPLOYED SUCCESSFULLY TO CLOUD RUN!     ${NC}"
echo -e "${GREEN}========================================================${NC}"
echo -e "Your Cloud Run URL is now live and running 100% in the Always-Free tier."
echo -e "Review service status with: gcloud run services describe ${SERVICE_NAME} --region=${REGION}"
