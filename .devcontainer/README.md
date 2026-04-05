# Claude Code devcontainer

Local development environment for Claude Code using Podman (rootless) and Zed.

## Local & Cloud Hybrid LLM

Authenticate:

```bash
claude auth login
```

Start `llama-swap` on the host machine:

```bash
ANTHROPIC_OAUTH_TOKEN=$(
  podman exec \
    $(podman container ls --format '{{.Names}} {{.Image}}' | awk '/vsc-/{print $1}' | head -n 1) \
    cat /home/dev/.claude/.credentials.json \
  | jq -r '.claudeAiOauth.accessToken'
) llama-swap --config .devcontainer/llama-swap.config.yaml --listen localhost:8080
```

## Prerequisites

### Podman

```bash
brew install podman
podman machine init
podman machine start
```

### llama-swap

```bash
brew tap mostlygeek/llama-swap
brew install llama-swap
```

### One-time Initialization

One-time initialization to symlink Podman for Zed and setup signing keys.

```bash
bash setup.sh
```

## Architecture

```
macOS host
├── ~/.devcontainer/                    ← personal devcontainer credentials
│   ├── signing_key                     ← container-only SSH signing key (private)
│   ├── signing_key.pub                 ← container-only SSH signing key (public)
│   ├── gitconfig.container             ← git config for the container
│   └── allowed_signers                 ← git SSH signature verification
│
├── project repo (.devcontainer/)       ← this directory
│   ├── Containerfile                   ← container definition file
│   ├── devcontainer.json               ← devcontainers configuration
│   ├── init-firewall.sh                ← network isolation setup and firewall
│   ├── llama-swap.config.yaml          ← llama-swap configuration for local & cloud hybrid
│   └── setup.sh                        ← one-time setup file ran on the host machine
│
└── Podman VM
    └── container: claude-code-dev
        ├── /workspaces                 ← mounted project
        └── named volumes
            ├── claude-config-*         ← Claude Code sessions, projects, settings (/home/dev/.claude)
            ├── claude-commandhistory-* ← shell history (/commandhistory)
            ├── node-modules-*          ← node_modules per project
            └── pnpm                    ← shared pnpm store across all projects
```

## Commit signing

Commits made inside the container are signed with the **devcontainer-only signing key** at `/home/dev/.ssh/signing_key`. To rotate, delete `~/.devcontainer/signing_key*`, re-run `setup.sh`, remove the old key from GitHub, add the new one.

## Network isolation

The firewall restricts outbound traffic to only the following services:

- `api.anthropic.com` — Claude API
- `statsig.anthropic.com`, `statsig.com` — Claude telemetry
- `sentry.io` — Claude Code error reporting
- `github.com` — GitHub operations
- `registry.npmjs.org`, `nodejs.org` — Node.js package registry
- `host.containers.internal:8080` — llama-swap proxy on the host
