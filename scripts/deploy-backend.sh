#!/usr/bin/env sh
# Deploy Yoga Studio backend container (POSIX sh — safe under dash /bin/sh).
# Expected env: DOCKER, SECRETS_FILE, WORKSPACE, MEDIA_VOLUME, BACKEND_CONTAINER,
#   BACKEND_IMAGE, BUILD_NUMBER, BACKEND_PORT, DOMAIN, BACKEND_DOMAIN

set -eu

if [ -z "${SECRETS_FILE:-}" ] || [ -z "${WORKSPACE:-}" ]; then
  echo "ERROR: SECRETS_FILE and WORKSPACE must be set" >&2
  exit 1
fi

DOCKER="${DOCKER:-docker}"
MEDIA_VOLUME="${MEDIA_VOLUME:-yogastudio-media}"
BACKEND_CONTAINER="${BACKEND_CONTAINER:-yogastudio-api}"
BACKEND_IMAGE="${BACKEND_IMAGE:-yogastudio-api}"
BACKEND_PORT="${BACKEND_PORT:-2005}"
DOMAIN="${DOMAIN:-yogastudio.airepro.in}"
BACKEND_DOMAIN="${BACKEND_DOMAIN:-yogastudio-s.airepro.in}"

if [ -z "${BUILD_NUMBER:-}" ]; then
  echo "ERROR: BUILD_NUMBER must be set" >&2
  exit 1
fi

if [ ! -f "${SECRETS_FILE}" ]; then
  echo "ERROR: secrets file missing: ${SECRETS_FILE}"
  echo "Create it with DATABASE_*, JWT_SECRET_KEY, APP_URL, FRONTEND_ORIGIN, MEDIA_PUBLIC_BASE_URL, etc."
  exit 1
fi

# Docker --env-file does NOT strip quotes (unlike Node dotenv).
# Normalize so DATABASE_PASSWORD='...' becomes DATABASE_PASSWORD=...
SECRETS_DOCKER="${WORKSPACE}/.jenkins-yogastudio.env"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
chmod +x "${SCRIPT_DIR}/normalize-docker-env.sh"
"${SCRIPT_DIR}/normalize-docker-env.sh" "${SECRETS_FILE}" "${SECRETS_DOCKER}"
chmod 600 "${SECRETS_DOCKER}"

# Note if original secrets still have quoted DATABASE_PASSWORD (POSIX-safe checks).
quoted=0
if grep -q "^DATABASE_PASSWORD='" "${SECRETS_FILE}"; then
  quoted=1
fi
if grep -q '^DATABASE_PASSWORD="' "${SECRETS_FILE}"; then
  quoted=1
fi
if [ "$quoted" -eq 1 ]; then
  echo "NOTE: stripped quotes from DATABASE_PASSWORD for Docker env-file compatibility"
fi

EGRESS_IP=$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || true)
echo "Jenkins egress IP (whitelist in MySQL Remote Access): ${EGRESS_IP:-unknown}"

${DOCKER} volume create "${MEDIA_VOLUME}" >/dev/null 2>&1 || true
${DOCKER} rm -f "${BACKEND_CONTAINER}" >/dev/null 2>&1 || true

${DOCKER} run -d \
  --name "${BACKEND_CONTAINER}" \
  --restart unless-stopped \
  --env-file "${SECRETS_DOCKER}" \
  -e API_PORT=2005 \
  -e APP_URL="https://${DOMAIN}" \
  -e FRONTEND_ORIGIN="https://${DOMAIN},http://${DOMAIN}:2004,http://localhost:2004" \
  -e MEDIA_PUBLIC_BASE_URL="https://${BACKEND_DOMAIN}/media" \
  -e MEDIA_STORAGE_DIR=./storage/media \
  -p "127.0.0.1:${BACKEND_PORT}:2005" \
  -v "${MEDIA_VOLUME}:/app/storage/media" \
  "${BACKEND_IMAGE}:${BUILD_NUMBER}"

rm -f "${SECRETS_DOCKER}"
