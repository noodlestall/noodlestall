# Merge checklist

Before merging feature/full-implementation into main, run these locally or confirm CI passes:

1. Install and run checks

```bash
npm ci
npm run check
npm run test
npm run build
```

2. Verify E2E (optional locally)

```bash
npx playwright install --with-deps
npm run test:e2e
```

3. Confirm GitHub Actions CI on the branch is green.

4. Merge feature/full-implementation → main via GitHub UI when ready.

Notes:
- The site is configured for GitHub Pages base path `/noodlestall/` and will publish to `https://noodlestall.github.io/noodlestall/` when the deploy workflow runs on main.
- If CI fails after merging, please check action logs and open an issue or request me to help fix failures.
