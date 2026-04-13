# Milestone: CI/CD

**Status:** Backlog
**Requirements:** CI-01, CI-02

## Goal

GitHub Actions pipelines for continuous integration and deployment to GitHub Pages.

## Requirements

- [ ] **CI-01**: GitHub Actions ci.yml runs oxlint, oxfmt check, tsc --noEmit, vitest, playwright, and vite build on push/PR
- [ ] **CI-02**: GitHub Actions deploy.yml deploys to GitHub Pages on push to main via actions/deploy-pages
