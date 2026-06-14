# Deploying 16-0 to GitHub Pages (with two commit authors)

Everything you need is in this `deploy/` folder: `index.html` (the game), `README.md`, `.nojekyll`, and `setup.sh`.

## 1. Create the GitHub repo
On github.com, log in with the account that will **own** the repo and create a new **empty** repository (no README, no .gitignore). Copy its URL, e.g. `https://github.com/yourname/16-0.git`.

## 2. Set the two authors and make the commits
1. Open Terminal and `cd` into this folder:
   ```
   cd ~/Desktop/16-0/deploy
   ```
2. Open `setup.sh`, edit the 7 lines at the top with your repo URL and the two accounts' names + emails, then run it:
   ```
   bash setup.sh
   ```
   This creates two commits — the game authored by Account One, the docs by Account Two — and wires up the remote.

### Making commits show up under each account
A commit links to a GitHub account when its **author email** matches an email on that account. The privacy-safe option is each account's *noreply* email — find it at **GitHub → Settings → Emails** ("Keep my email private" shows `1234567+username@users.noreply.github.com`). Put each account's noreply email into `EMAIL1` / `EMAIL2`.

For the **second account to get contribution-graph credit**, it needs access to the repo: after pushing, go to the repo's **Settings → Collaborators → Add people** and invite the second account (accept the invite from that account). Commits authored with its email then count toward its contributions.

## 3. Push
```
git push -u origin main
```
GitHub will ask you to authenticate the first time — use a **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens) in place of a password, or the GitHub CLI (`gh auth login`). Push with whichever account owns the repo; authorship of each commit is preserved regardless of who pushes.

## 4. Turn on GitHub Pages
In the repo: **Settings → Pages → Build and deployment → Source: "Deploy from a branch" → Branch: `main` / `/ (root)` → Save.**

After a minute your game is live at:
```
https://USERNAME.github.io/REPO/
```
(`.nojekyll` is included so Pages serves the file as-is.) Add that URL to the top of `README.md` and commit/push the change.

## Notes
- It's a single self-contained file — no build step, nothing else to configure.
- To update the game later, replace `index.html` with a new build, then `git add index.html && git commit && git push`.
