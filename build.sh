#!/bin/bash -e
# This script publishes the GraphQL specification document to the web.

# Determine if this is a tagged release
GITTAG=$(git tag --points-at HEAD)

# Build the specification draft document
echo "Building spec draft"
mkdir -p public/draft
spec-md --metadata spec/metadata.json --githubSource "https://github.com/graphql/graphql-spec/blame/main/" spec/GraphQL.md > public/draft/index.html

# If this is a tagged commit, also build the release document
if [ -n "$GITTAG" ]; then
  echo "Building spec release $GITTAG"
  mkdir -p "public/$GITTAG"
  spec-md --metadata spec/metadata.json --githubSource "https://github.com/graphql/graphql-spec/blame/$GITTAG/" spec/GraphQL.md > "public/$GITTAG/index.html"
fi

# Create the index file
echo "Rebuilding: / (index)"
HTML="<html>
  <head>
    <title>GraphQL Specification Versions</title>
    <style>
      body {
        color: #333333;
        font: 13pt/18pt Cambria, 'Palatino Linotype', Palatino, 'Liberation Serif', serif;
        margin: 6rem auto 3rem;
        max-width: 780px;
      }
      @media (min-width: 1240px) {
        body {
          padding-right: 300px;
        }
      }
      a {
        color: #3B5998;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      h1 {
        font-size: 1.5em;
        margin: 8rem 0 2em;
      }
      td {
        padding-bottom: 5px;
      }
      td + td {
        padding-left: 2ch;
      }
    </style>
  </head>
  <body>
    <h1>GraphQL</h1>
    <table>"

# Include latest draft
GITDATE=$(git show -s --format=%cd --date=format:"%a, %b %-d, %Y" HEAD)
HTML="$HTML
    <tr>
      <td><em>Prerelease</em></td>
      <td><a href=\"./draft\" keep-hash>Working Draft</a></td>
      <td>$GITDATE</td>
      <td></td>
    </tr>"

GITHUB_RELEASES="https://github.com/graphql/graphql-spec/releases/tag"
for GITTAG in $(git tag -l --sort='-*committerdate') ; do
  VERSIONYEAR=${GITTAG: -4}
  TAGTITLE="${GITTAG%$VERSIONYEAR} $VERSIONYEAR"
  TAGGEDCOMMIT=$(git rev-list -1 "$GITTAG")
  GITDATE=$(git show -s --format=%cd --date=format:"%a, %b %-d, %Y" $TAGGEDCOMMIT)

  HTML="$HTML
    <tr>"

  [ -z $HAS_LATEST_RELEASE ] && HTML="$HTML
      <td><em>Latest Release</em></td>" || HTML="$HTML
      <td></td>"
  HAS_LATEST_RELEASE=1

  HTML="$HTML
      <td><a href=\"./$GITTAG\" keep-hash>$TAGTITLE</a></td>
      <td>$GITDATE</td>
      <td><a href=\"$GITHUB_RELEASES/$GITTAG\">Release Notes</a></td>
    </tr>"
done

HTML="$HTML
    </table>
    <script>
      var links = document.getElementsByTagName('a');
      for (var i = 0; i < links.length; i++) {
        if (links[i].hasAttribute('keep-hash')) {
          links[i].href += location.hash;
          links[i].removeAttribute('keep-hash');
        }
      }
    </script>
  </body>
</html>"

echo $HTML > "public/index.html"
