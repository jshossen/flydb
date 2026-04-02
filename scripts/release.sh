#!/bin/bash
set -euo pipefail

PLUGIN_SLUG="flydb"
SVN_REPO_URL="https://plugins.svn.wordpress.org/${PLUGIN_SLUG}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_ROOT="$ROOT_DIR/temp"
RELEASE_DIR="$TMP_ROOT/${PLUGIN_SLUG}-release"
LOG_PREFIX="[release]"

abort() {
  echo "${LOG_PREFIX} $1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || abort "Missing required command: $1"
}

usage() {
  cat <<EOF
Usage: npm run release [--skip-build] [--skip-deploy]

Flags:
  --skip-build   Re-use existing build/ artifacts instead of rerunning npm run build
  --skip-deploy  Build & package only (no SVN deploy)
  -h, --help     Show this help message
EOF
}

SKIP_BUILD=0
SKIP_DEPLOY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build)
      SKIP_BUILD=1
      ;;
    --skip-deploy)
      SKIP_DEPLOY=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      abort "Unknown argument: $1"
      ;;
  esac
  shift
done

require_cmd npm
if [[ $SKIP_BUILD -eq 0 ]]; then
  require_cmd zip
fi
if [[ $SKIP_DEPLOY -eq 0 ]]; then
  require_cmd svn
  require_cmd rsync
fi

SVN_AUTH_ARGS=()
if [[ $SKIP_DEPLOY -eq 0 ]]; then
  read -p "Enter WordPress.org SVN username: " SVN_USERNAME
  [[ -n "$SVN_USERNAME" ]] || abort "SVN username is required"
  read -s -p "Enter WordPress.org SVN password: " SVN_PASSWORD
  echo ""
  [[ -n "$SVN_PASSWORD" ]] || abort "SVN password is required"
  SVN_AUTH_ARGS=(--username "$SVN_USERNAME" --password "$SVN_PASSWORD" --no-auth-cache)
fi

BUILD_DIR="$ROOT_DIR/build"
PACKAGE_DIR="$BUILD_DIR/$PLUGIN_SLUG"
SVN_DIR="$RELEASE_DIR/svn"
ASSETS_DIR="$ROOT_DIR/.wordpress-org/assets"
PLUGIN_VERSION=$(grep -oE "define\(\s*'FLYDB_VERSION'\s*,\s*'[^']+'" "$ROOT_DIR/flydb.php" | sed "s/.*'\([^']*\)'/\1/")
VERSION="$PLUGIN_VERSION"
ZIP_PATH="$BUILD_DIR/${PLUGIN_SLUG}-${VERSION}.zip"

echo "${LOG_PREFIX} preparing release for v${VERSION}"

mkdir -p "$TMP_ROOT"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

if [[ $SKIP_BUILD -eq 0 ]]; then
  pushd "$ROOT_DIR" >/dev/null
    echo "${LOG_PREFIX} running npm run build"
    npm run build
    echo "${LOG_PREFIX} running npm run package"
    npm run package
  popd >/dev/null
else
  echo "${LOG_PREFIX} skipping build (reusing existing artifacts)"
fi

[[ -d "$PACKAGE_DIR" ]] || abort "Build directory missing: $PACKAGE_DIR"

if [[ -f "$ZIP_PATH" ]]; then
  echo "${LOG_PREFIX} found distributable zip at $ZIP_PATH"
else
  echo "${LOG_PREFIX} warning: zip not found in build directory"
fi

if [[ $SKIP_DEPLOY -eq 0 ]]; then
  echo "${LOG_PREFIX} deploying to WordPress SVN"
  svn checkout "$SVN_REPO_URL" "$SVN_DIR" "${SVN_AUTH_ARGS[@]}"
  rsync -av --delete "$PACKAGE_DIR/" "$SVN_DIR/trunk/"
  if [[ -d "$ASSETS_DIR" ]]; then
    echo "${LOG_PREFIX} syncing WordPress.org assets"
    mkdir -p "$SVN_DIR/assets"
    rsync -av --delete "$ASSETS_DIR/" "$SVN_DIR/assets/"
    find "$SVN_DIR/assets" -name '.gitkeep' -type f -delete
  else
    echo "${LOG_PREFIX} note: no .wordpress-org/assets directory found"
  fi
  pushd "$SVN_DIR" >/dev/null
    svn add --force trunk assets tags >/dev/null 2>&1 || true
    deleted_paths=$(svn status | awk '/^!/ {print substr($0, 9)}')
    if [[ -n "$deleted_paths" ]]; then
      while IFS= read -r path; do
        [[ -n "$path" ]] && svn rm "$path"
      done <<<"$deleted_paths"
    fi
    svn commit -m "Release version $VERSION" trunk assets "${SVN_AUTH_ARGS[@]}"
  popd >/dev/null

  if svn ls "$SVN_REPO_URL/tags/$VERSION" "${SVN_AUTH_ARGS[@]}" >/dev/null 2>&1; then
    echo "${LOG_PREFIX} tag $VERSION already exists; skipping tag creation"
  else
    svn copy "$SVN_REPO_URL/trunk" "$SVN_REPO_URL/tags/$VERSION" -m "Tag version $VERSION" "${SVN_AUTH_ARGS[@]}"
  fi

  echo "${LOG_PREFIX} deploy complete"
else
  echo "${LOG_PREFIX} skipping SVN deploy"
fi

echo "${LOG_PREFIX} release $VERSION finished"
