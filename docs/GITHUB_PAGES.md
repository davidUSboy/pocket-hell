# GitHub Pages setup

Pocket Hell includes a complete deployment workflow in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

## First publication

GitHub Pages must be enabled once for every new repository:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open **Actions** and run **Deploy Pocket Hell to GitHub Pages**, or push a commit to `main`.
4. The published game will be available at `https://<username>.github.io/<repository>/`.

After this one-time setup, every push to `main` is validated, built and deployed automatically.

## What the workflow does

1. Checks out the repository.
2. Installs the pinned development dependencies.
3. Validates the map and required project files.
4. Runs strict TypeScript checks and builds the Vite site.
5. Uploads the `dist/` directory as a Pages artifact.
6. Deploys the artifact to the `github-pages` environment.

No separate `gh-pages` branch is required.
