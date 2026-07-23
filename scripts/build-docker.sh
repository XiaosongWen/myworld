#!/usr/bin/env bash
set -e

IMAGE_NAME=${1:-"myworld"}
IMAGE_TAG=${2:-"latest"}

FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

echo "=========================================="
echo "Building Unified Docker Image: ${FULL_IMAGE}"
echo "=========================================="

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="${SCRIPT_DIR}/.."

docker build -t "${FULL_IMAGE}" -f "${REPO_ROOT}/Dockerfile" "${REPO_ROOT}"

echo "=========================================="
echo "Successfully built ${FULL_IMAGE}"
echo "=========================================="
