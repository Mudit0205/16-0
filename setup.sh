#!/usr/bin/env bash
# 16-0 — git setup with TWO commit authors, then push to GitHub.
# Run this inside the deploy/ folder on your Mac:  bash setup.sh
set -e

# ========= EDIT THESE 7 LINES =========
REPO_URL="https://github.com/Mudit0205/16-0.git"   # create an EMPTY repo on github.com first, paste its URL here

NAME1="Mudit0205"                                # 1st GitHub account
EMAIL1="yadavmudit.0205@gmail.com"            # use this account's verified or noreply email

NAME2="Wa11y-5qua5h"                                # 2nd GitHub account
EMAIL2="srijityadav2@gmail.com"            # use this account's verified or noreply email
# ======================================

# fresh repo (removes any partial .git that may be in this folder)
rm -rf .git
git init -q
git branch -M main

# ---- Commit 1, authored by Account One: the game ----
git add index.html .nojekyll
GIT_AUTHOR_NAME="$NAME1"  GIT_AUTHOR_EMAIL="$EMAIL1" \
GIT_COMMITTER_NAME="$NAME1" GIT_COMMITTER_EMAIL="$EMAIL1" \
  git commit -q -m "Add 16-0 — single-file IPL draft & sim game"

# ---- Commit 2, authored by Account Two: the docs ----
git add README.md
GIT_AUTHOR_NAME="$NAME2"  GIT_AUTHOR_EMAIL="$EMAIL2" \
GIT_COMMITTER_NAME="$NAME2" GIT_COMMITTER_EMAIL="$EMAIL2" \
  git commit -q -m "Add README and project documentation"

git remote add origin "$REPO_URL"
echo
echo "Local repo ready with two authors:"
git log --pretty=format:"  %h  %an <%ae>  %s"
echo
echo
echo "Next:  git push -u origin main"
echo "(GitHub will prompt for credentials / a Personal Access Token the first time.)"
