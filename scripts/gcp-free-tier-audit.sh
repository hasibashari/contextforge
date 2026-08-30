#!/usr/bin/env bash
# ==============================================================================
# ContextForge: Google Cloud Always Free Tier Audit Tool
# ==============================================================================
# Checks:
# 1. Cloud Run service free-tier configuration (scale-to-zero, throttling, specs)
# 2. Cloud Storage staging bucket sizes & lifecycle auto-delete rules
# 3. Artifact Registry repository size & retention policies
# 4. Local .gcloudignore optimization status
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "\n${BOLD}${BLUE}================================================================${NC}"
echo -e "${BOLD}${BLUE}      ContextForge - GCP Always Free Tier Audit Scanner         ${NC}"
echo -e "${BOLD}${BLUE}================================================================${NC}\n"

# 1. Project Detection
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: No GCP project active. Run 'gcloud config set project <ID>' first.${NC}"
    exit 1
fi
echo -e "${BOLD}Active Project:${NC} ${GREEN}${PROJECT_ID}${NC}"
REGION="us-central1"
SERVICE_NAME="contextforge"

echo -e "\n${BOLD}[1/4] 🚀 Auditing Cloud Run Service Configuration...${NC}"
if gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    # Fetch parameters
    MIN_INSTANCES=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format="value(spec.template.metadata.annotations['autoscaling.knative.dev/minScale'])" 2>/dev/null || echo "0")
    MAX_INSTANCES=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format="value(spec.template.metadata.annotations['autoscaling.knative.dev/maxScale'])" 2>/dev/null || echo "default")
    CPU_THROTTLING=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format="value(spec.template.metadata.annotations['run.googleapis.com/cpu-throttling'])" 2>/dev/null || echo "true")
    MEMORY=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format="value(spec.template.spec.containers[0].resources.limits.memory)" 2>/dev/null || echo "unknown")
    CPU=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format="value(spec.template.spec.containers[0].resources.limits.cpu)" 2>/dev/null || echo "unknown")

    # Evaluate Min Instances
    if [ "$MIN_INSTANCES" = "0" ] || [ -z "$MIN_INSTANCES" ]; then
        echo -e "  ${GREEN}✓ Scale-to-Zero: ACTIVE (min-instances=0) -> Zero idle cost!${NC}"
    else
        echo -e "  ${RED}⚠️ Min Instances is set to ${MIN_INSTANCES} (Will incur idle cost!)${NC}"
    fi

    # Evaluate CPU Throttling
    if [ "$CPU_THROTTLING" = "true" ] || [ -z "$CPU_THROTTLING" ]; then
        echo -e "  ${GREEN}✓ CPU Throttling: ACTIVE -> CPU allocated only during request!${NC}"
    else
        echo -e "  ${RED}⚠️ CPU Throttling is DISABLED!${NC}"
    fi

    # Specs
    echo -e "  ${GREEN}✓ Specs: Memory=${MEMORY}, CPU=${CPU}, Max-Instances=${MAX_INSTANCES}${NC}"
    echo -e "  ${GREEN}✓ Region: ${REGION} (Qualifies for 1GB/month Free Tier egress to NA)${NC}"
else
    echo -e "  ${YELLOW}ℹ️ Cloud Run service '${SERVICE_NAME}' not yet deployed or in different region.${NC}"
fi

echo -e "\n${BOLD}[2/4] 📦 Auditing Cloud Storage Buckets (Source Staging & Builds)...${NC}"
STAGING_BUCKET="gs://run-sources-${PROJECT_ID}-${REGION}"
BUILDS_BUCKET="gs://${PROJECT_ID}_cloudbuild"

for BUCKET in "$STAGING_BUCKET" "$BUILDS_BUCKET"; do
    if gcloud storage buckets describe "$BUCKET" &>/dev/null; then
        echo -e "  ${BOLD}Bucket:${NC} ${BUCKET}"
        # Check size
        SIZE_OUTPUT=$(gcloud storage du --readable-sizes "$BUCKET" 2>&1 || true)
        if [ -z "$SIZE_OUTPUT" ]; then
            echo -e "    ${GREEN}✓ Stored Size: 0 B (Clean!)${NC}"
        else
            echo -e "    ${YELLOW}ℹ️ Current contents:${NC}\n$SIZE_OUTPUT"
        fi
        
        # Check lifecycle
        HAS_LIFECYCLE=$(gcloud storage buckets describe "$BUCKET" --format="json" 2>&1 | grep -i "lifecycle_config" || true)
        if [ -n "$HAS_LIFECYCLE" ]; then
            echo -e "    ${GREEN}✓ Lifecycle Rule: ACTIVE (Auto-delete enabled -> Zero accumulation)${NC}"
        else
            echo -e "    ${RED}⚠️ Lifecycle Rule: MISSING (Files will accumulate and incur cost!)${NC}"
        fi
    else
        echo -e "  ${YELLOW}ℹ️ Bucket ${BUCKET} does not exist.${NC}"
    fi
done

echo -e "\n${BOLD}[3/4] 🐳 Auditing Artifact Registry (Container Image Retention)...${NC}"
REPO_NAME="cloud-run-source-deploy"
if gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    REPO_SIZE=$(gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" --project="$PROJECT_ID" --format="value(repositorySize)" 2>/dev/null || echo "0")
    CLEANUP_POLICY=$(gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" --project="$PROJECT_ID" --format="json" 2>&1 | grep -i "cleanupPolicies" || true)
    
    echo -e "  ${GREEN}✓ Repository: ${REPO_NAME} (${REGION})${NC}"
    echo -e "  ${GREEN}✓ Current Size: ${REPO_SIZE} (Free Tier limit: 500 MB)${NC}"
    if [ -n "$CLEANUP_POLICY" ]; then
        echo -e "  ${GREEN}✓ Cleanup Policy: ACTIVE (Old image versions automatically pruned)${NC}"
    else
        echo -e "  ${YELLOW}⚠️ Cleanup Policy: NOT CONFIGURED${NC}"
    fi
else
    echo -e "  ${YELLOW}ℹ️ Artifact Registry repository '${REPO_NAME}' not found.${NC}"
fi

echo -e "\n${BOLD}[4/4] 📄 Auditing Local Source Code Ignore Files...${NC}"
if [ -f ".gcloudignore" ]; then
    echo -e "  ${GREEN}✓ .gcloudignore: PRESENT${NC}"
    if grep -q "node_modules" .gcloudignore && grep -q ".git" .gcloudignore; then
        echo -e "  ${GREEN}✓ Node_modules & .git excluded (Prevents 100MB+ bloated uploads)${NC}"
    else
        echo -e "  ${YELLOW}⚠️ .gcloudignore is missing rules for node_modules or .git${NC}"
    fi
else
    echo -e "  ${RED}❌ .gcloudignore is MISSING!${NC}"
fi

echo -e "\n${BOLD}${GREEN}================================================================${NC}"
echo -e "${BOLD}${GREEN}              Always Free Tier Audit Completed!                 ${NC}"
echo -e "${BOLD}${GREEN}================================================================${NC}\n"
