# AWS Orbit Masterclass

An extensively detailed, self-paced digital course on Amazon Web Services — roughly **5–6 hours** of deep-dive reading, diagrams, and interactive quizzes. Built as a static site (HTML + Tailwind CDN + modular JavaScript) so it deploys cleanly to **GitHub Pages**.

## What’s included

| File | Purpose |
|------|---------|
| `index.html` | Course shell: space-themed UI, responsive sidebar/drawer TOC, all module content |
| `script.js` | Progress tracking, mobile nav, scroll spy, and dynamic MCQ rendering with option shuffling |
| `CNAME` | Custom domain placeholder for GitHub Pages |
| `README.md` | This guide |

## Local preview

No build step required.

```bash
# Option A — Python
python3 -m http.server 8080

# Option B — Node
npx serve .
```

Open `http://localhost:8080` in your browser.

## Hosting on GitHub Pages

This repository is currently **private**. GitHub Pages behavior depends on your plan and visibility. Follow the path that matches your account.

### Path A — Keep the repo private (GitHub Pro / Team / Enterprise)

GitHub Pages for **private** repositories requires a paid plan:

- **GitHub Pro** (individual)
- **GitHub Team** or **Enterprise** (organizations)

Steps:

1. Confirm your account has Pages for private repos: [GitHub Plans](https://github.com/pricing).
2. Push this project to GitHub (if it is not already remote).
3. Open the repo → **Settings** → **Pages**.
4. Under **Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** `main` (or `master`)
   - **Folder:** `/ (root)`
5. Click **Save**.
6. Wait 1–2 minutes, then open the Pages URL shown on that settings page  
   (typically `https://<username>.github.io/<repo-name>/`).

> Site content from a private repo’s Pages site is still **served publicly** at the Pages URL unless you use other access controls (Enterprise). Anyone with the URL can view the published HTML.

### Path B — Make the repo public (free GitHub Free)

If you do not have Pro/Team/Enterprise, make the repository public before enabling Pages.

**Before you flip visibility — safety checklist**

1. Search the repo for secrets: API keys, AWS access keys, `.env` files, private PEM keys, internal URLs.
2. Confirm commit history does not contain leaked credentials (`git log -p` / secret scanning).
3. Ensure `CNAME` / docs do not expose internal hostnames you care about.
4. Optionally force-push a cleaned history only if you know what you are doing — prefer rotating any leaked credentials instead.

**Change visibility**

1. Repo → **Settings** → **General** → scroll to **Danger Zone**.
2. Click **Change repository visibility** → **Make public**.
3. Type the repo name to confirm.

**Enable Pages**

1. Repo → **Settings** → **Pages**.
2. **Source:** Deploy from a branch.
3. **Branch:** `main` → `/ (root)` → **Save**.
4. Visit `https://<username>.github.io/<repo-name>/`.

### Custom domain (optional)

1. Edit `CNAME` and replace `www.yourcustomdomain.com` with your domain.
2. In your DNS provider, add:
   - **Apex (`example.com`):** A records to GitHub Pages IPs (see [GitHub Docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)), or
   - **Subdomain (`www.example.com`):** CNAME → `<username>.github.io`
3. In **Settings → Pages**, enter the same custom domain and enable **Enforce HTTPS** once DNS propagates.

### Project Pages vs User/Organization Pages

- This course is structured as a **project site** (`username.github.io/repo-name/`).
- Relative asset paths (`script.js`, etc.) work from the repo root.
- If you later move this to a user site (`username.github.io`), put files on the `main` branch of that special repo (or `docs/` / `gh-pages` as preferred).

## Course architecture (for contributors)

```
aws-tute/
├── index.html      # Markup + Tailwind CDN + course modules
├── script.js       # Nav, progress, quizzes (data-driven)
├── CNAME           # Custom domain for Pages
└── README.md
```

### Adding a new module

1. Add a `<section id="module-N">` in `index.html` with content, SVGs, and a quiz mount point:
   ```html
   <div class="quiz-root" data-quiz="moduleN"></div>
   ```
2. Register the TOC link in the sidebar and mobile drawer.
3. Append a question array in `script.js` under `QUIZ_BANK.moduleN`.
4. Each question object shape:

```js
{
  id: "m2-q01",
  prompt: "What does IAM stand for?",
  options: [
    { text: "Identity and Access Management", correct: true },
    { text: "Internet Application Module", correct: false },
    { text: "Instance Allocation Map", correct: false },
    { text: "Internal Audit Monitor", correct: false }
  ],
  explanation: "IAM is AWS’s identity and access control plane..."
}
```

Options are shuffled at render time with a seeded distribution so correct answers are spread across A–D.

## License / content note

Course prose and diagrams in this repo are original instructional material for learning AWS. AWS and Amazon Web Services are trademarks of Amazon.com, Inc. or its affiliates.
