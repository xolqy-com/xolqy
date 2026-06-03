# Tech-detection submissions (Wappalyzer, BuiltWith, etc.)

Files to get **Xolqy** recognized by website technology-detection tools.

- `Xolqy.json` — the technology definition (category 10 = Analytics).
- `Xolqy.svg` — the icon (orange rounded square, white "X").

## Detection signals Xolqy already exposes
- **Script src:** `xolqy.com/t.js`, `xolqy.com/v1/t.js`, `xolqy.com/track.js`
- **JS global:** `window.__xolqy__` (set by the tracker)

These are what the definition matches on.

## Where to submit

1. **webappanalyzer (open-source fork of Wappalyzer's ruleset)** — https://github.com/enthec/webappanalyzer
   - Merge the `"Xolqy"` entry from `Xolqy.json` into `src/technologies/x.json`.
   - Add `Xolqy.svg` to `src/images/icons/`.
   - Open a PR. Used by many downstream tools.

2. **Wappalyzer (official, commercial dataset)** — submit via their site's
   "Submit a technology" / contact form (the main ruleset is no longer open to PRs).
   Provide the same fields and icon.

3. **BuiltWith** — https://builtwith.com (use their add/contact form).

4. **WhatRuns / others** — each has its own submission form.

## Note
Detection only *shows* on sites that actually load the tracker. Coverage improves
as more sites adopt Xolqy and the crawlers re-scan. Keep the `scriptSrc` regex in
sync if the tracker URL ever changes.
