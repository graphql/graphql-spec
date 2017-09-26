#!/bin/bash -e
# This script publishes the GraphQL specification document to the web.

# Build the specification document into publishable form
echo "Building spec"
npm run build > /dev/null 2>&1

# Determine if this is a tagged release
GITTAG=$(git tag --points-at HEAD)

# Check out gh-pages locally.
echo "Cloning gh-pages"
rm -rf gh-pages
git clone -b gh-pages "https://${GH_TOKEN}@github.com/facebook/graphql.git" gh-pages > /dev/null 2>&1
pushd gh-pages > /dev/null 2>&1

# Replace /draft with this build.
echo "Publishing to: /draft"
rm -rf draft
cp -r ../out/ draft

# If this is a tagged commit, publish to a permalink and index.
if [ -n "$GITTAG" ]; then
  echo "Publishing to: /$GITTAG"
  cp -r ../out/ "$GITTAG"

  echo "Linking from: / (index)"
  echo '<html>
  <head>
    <meta http-equiv="refresh" content="0; url=./'"$GITTAG"'" />
    <title>GraphQL Specification</title>
  </head>
  <body>
    Redirecting to the latest release: <a href="./'"$GITTAG"'">'"$GITTAG"'</a>
  </body>
</html>' > index.html
fi

echo "Pushing update"
git config user.name "Travis CI"
git config user.email "github@fb.com"
git add -A .
if git diff --staged --quiet; then
  echo "Nothing to publish"
else
  git commit -a -m "Deploy to GitHub Pages"
  git push > /dev/null 2>&1
  echo "Pushed"
fi

popd > /dev/null 2>&1
