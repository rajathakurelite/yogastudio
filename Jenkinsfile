/*
 * Yoga Studio — Jenkins Pipeline (Dockerized FE + BE)
 *
 * Domains / ports (override via Jenkins job env):
 * - SPA:  yogastudio.airepro.in   → 127.0.0.1:2004
 * - API:  yogastudio-s.airepro.in → 127.0.0.1:2005
 *
 * Prerequisites:
 * - Docker on the agent. If jenkins is not in the docker group, set DOCKER='sudo docker'.
 * - Backend secrets at SECRETS_FILE (default /home/airepro/.secrets/yogastudio.env)
 *   Must include DATABASE_* , JWT_SECRET_KEY, and optional ANTHROPIC_API_KEY / FABLE_*.
 * - DATABASE_PASSWORD must be UNQUOTED in the secrets file (Docker --env-file keeps quotes).
 *   Example: DATABASE_PASSWORD=&P}Gk3eK,k{i5dTX
 * - Whitelist the Jenkins egress IP in MySQL "Remote MySQL Access" on pole.hostitbro.com
 *   (cPanel → Remote MySQL). The smoke stage prints the egress IP on failure.
 * - Cloudflare Tunnel / edge proxy targeting localhost:2004 and localhost:2005.
 */

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        DEPLOY_BRANCH       = "${env.DEPLOY_BRANCH ?: 'main'}"
        FRONTEND_IMAGE      = "${env.FRONTEND_IMAGE ?: 'yogastudio-ui'}"
        BACKEND_IMAGE       = "${env.BACKEND_IMAGE ?: 'yogastudio-api'}"
        FRONTEND_CONTAINER  = "${env.FRONTEND_CONTAINER ?: 'yogastudio-ui'}"
        BACKEND_CONTAINER   = "${env.BACKEND_CONTAINER ?: 'yogastudio-api'}"
        FRONTEND_PORT       = "${env.FRONTEND_PORT ?: '2004'}"
        BACKEND_PORT        = "${env.BACKEND_PORT ?: '2005'}"
        DOMAIN              = "${env.DOMAIN ?: 'yogastudio.airepro.in'}"
        BACKEND_DOMAIN      = "${env.BACKEND_DOMAIN ?: 'yogastudio-s.airepro.in'}"
        VITE_API_BASE_URL   = "${env.VITE_API_BASE_URL ?: 'https://yogastudio-s.airepro.in/api/v1'}"
        SECRETS_FILE        = "${env.SECRETS_FILE ?: '/home/airepro/.secrets/yogastudio.env'}"
        MEDIA_VOLUME        = "${env.MEDIA_VOLUME ?: 'yogastudio-media'}"
        DOCKER              = "${env.DOCKER ?: 'docker'}"
        JENKINS_NODE_COOKIE = 'dontKillMe'
        BUILD_ID            = 'dontKillMe'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "*/${env.DEPLOY_BRANCH}"]],
                    extensions: [],
                    userRemoteConfigs: scm.userRemoteConfigs,
                ])
                sh 'git log -1 --oneline'
            }
        }

        stage('Build backend image') {
            steps {
                sh '''
                set -e
                ${DOCKER} build \
                  -t "${BACKEND_IMAGE}:${BUILD_NUMBER}" \
                  -t "${BACKEND_IMAGE}:latest" \
                  ./backend
                '''
            }
        }

        stage('Build frontend image') {
            steps {
                sh '''
                set -e
                ${DOCKER} build \
                  --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
                  -t "${FRONTEND_IMAGE}:${BUILD_NUMBER}" \
                  -t "${FRONTEND_IMAGE}:latest" \
                  ./frontend
                '''
            }
        }

        stage('Deploy backend') {
            steps {
                sh '''
                set -e
                chmod +x "${WORKSPACE}/scripts/deploy-backend.sh" \
                         "${WORKSPACE}/scripts/normalize-docker-env.sh"
                "${WORKSPACE}/scripts/deploy-backend.sh"
                '''
            }
        }

        stage('Deploy frontend') {
            steps {
                sh '''
                set -e
                ${DOCKER} rm -f "${FRONTEND_CONTAINER}" >/dev/null 2>&1 || true
                ${DOCKER} run -d \
                  --name "${FRONTEND_CONTAINER}" \
                  --restart unless-stopped \
                  -p "127.0.0.1:${FRONTEND_PORT}:80" \
                  "${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                '''
            }
        }

        stage('Smoke test') {
            steps {
                sh '''
                set -e

                echo "Waiting for backend :${BACKEND_PORT} ..."
                for i in $(seq 1 45); do
                  if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; then
                    break
                  fi
                  if [ "$i" = "45" ]; then
                    echo "ERROR: backend never became healthy"
                    EGRESS_IP="$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || true)"
                    echo "Jenkins egress IP to whitelist in MySQL Remote Access: ${EGRESS_IP:-unknown}"
                    echo "Also verify /home/airepro/.secrets/yogastudio.env has UNQUOTED DATABASE_PASSWORD"
                    ${DOCKER} logs --tail 100 "${BACKEND_CONTAINER}" || true
                    exit 1
                  fi
                  sleep 2
                done
                curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health"
                echo ""
                curl -fsS -o /dev/null -w "api classes HTTP %{http_code}\\n" \
                  "http://127.0.0.1:${BACKEND_PORT}/api/v1/yoga/classes?pageSize=1"

                echo "Waiting for frontend :${FRONTEND_PORT} ..."
                for i in $(seq 1 15); do
                  if curl -fsS -o /dev/null "http://127.0.0.1:${FRONTEND_PORT}/"; then
                    break
                  fi
                  [ "$i" = "15" ] && { ${DOCKER} logs --tail 50 "${FRONTEND_CONTAINER}"; exit 1; }
                  sleep 2
                done
                curl -fsS -o /dev/null -w "frontend HTTP %{http_code}\\n" \
                  -H "Host: ${DOMAIN}" "http://127.0.0.1:${FRONTEND_PORT}/"
                '''
            }
        }
    }

    post {
        success {
            sh '''
            ${DOCKER} images "${BACKEND_IMAGE}" --format '{{.Tag}}' \
              | grep -E '^[0-9]+$' | sort -rn | tail -n +4 \
              | xargs -r -I{} ${DOCKER} rmi "${BACKEND_IMAGE}:{}" || true
            ${DOCKER} images "${FRONTEND_IMAGE}" --format '{{.Tag}}' \
              | grep -E '^[0-9]+$' | sort -rn | tail -n +4 \
              | xargs -r -I{} ${DOCKER} rmi "${FRONTEND_IMAGE}:{}" || true
            '''
        }
    }
}
