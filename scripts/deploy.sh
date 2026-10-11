#!/bin/sh
# Builds the app and publishes it to the gh-pages branch (GitHub Pages).
set -e
REPO=$(git remote get-url origin)
NAME=$(basename -s .git "$REPO")
OWNER=$(echo "$REPO" | sed -E 's#.*github.com[/:]([^/]+)/.*#\1#' | tr 'A-Z' 'a-z')
case "$NAME" in
  *.github.io) BASE="/"; URL="https://$(echo "$NAME" | tr 'A-Z' 'a-z')/" ;;
  *) BASE="/$NAME/"; URL="https://$OWNER.github.io/$NAME/" ;;
esac
BASE_PATH="$BASE" npm run build
cp dist/index.html dist/404.html   # SPA fallback for deep links
mkdir -p dist/nivel && cp dist/index.html dist/nivel/index.html   # the public level check gets a real 200 page (nicer link previews)
touch dist/.nojekyll
cd dist
git init -q -b gh-pages
git add -A
git commit -qm "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git push -qf "$REPO" gh-pages
rm -rf .git
echo "Published: $URL"
