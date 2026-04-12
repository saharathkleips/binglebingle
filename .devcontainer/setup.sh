#!/bin/bash
# Sets up DevContainers by:
# - Symlinking podman→docker
# - Creates in ~/.devcontainer/:
#     signing_key / signing_key.pub  — dedicated SSH signing key for the container
#     gitconfig.container            — git config for use inside the container
#     allowed_signers                — git SSH signature verification file

set -euo pipefail

DEVCONTAINER_DIR="${HOME}/.devcontainer"
mkdir -p "${DEVCONTAINER_DIR}"
chmod 700 "${DEVCONTAINER_DIR}"


# ── podman → docker symlink ────────────────────────────────────────────────
if command -v docker &>/dev/null; then
    echo "✓ docker command found — skipping symlink"
else
    PODMAN_PATH=$(command -v podman 2>/dev/null || echo "")
    if [ -z "${PODMAN_PATH}" ]; then
        echo "✗ podman not found, please install it first:"
        echo "brew install podman && podman machine init && podman machine start"
        exit 1
    fi

    # /usr/local/bin is on PATH for all users on macOS
    SYMLINK_TARGET="/usr/local/bin/docker"
    echo "creating podman→docker symlink at ${SYMLINK_TARGET}"
    echo "  (requires sudo)"
    sudo mkdir -p /usr/local/bin
    sudo ln -sf "${PODMAN_PATH}" "${SYMLINK_TARGET}"
    echo "✓ symlink created: ${SYMLINK_TARGET} → ${PODMAN_PATH}"
fi

# ── container signing key ──────────────────────────────────────────────────
DEVCONTAINER_SIGNING_KEY="${DEVCONTAINER_DIR}/signing_key"

if [ -f "${DEVCONTAINER_SIGNING_KEY}" ]; then
    echo "✓ signing key already exists — skipping generation"
else
    echo "generating devcontainer-only signing key..."
    ssh-keygen -t ed25519 -f "${DEVCONTAINER_SIGNING_KEY}" -C "devcontainer-signing" -N ""
    chmod 600 "${DEVCONTAINER_SIGNING_KEY}"
    chmod 644 "${DEVCONTAINER_SIGNING_KEY}.pub"
    echo "✓ signing key generated at ${DEVCONTAINER_SIGNING_KEY}"
fi

# ── devcontainer git config ───────────────────────────────────────────────────
DEVCONTAINER_GITCONFIG="${DEVCONTAINER_DIR}/gitconfig.container"

if [ -f "${DEVCONTAINER_GITCONFIG}" ]; then
    echo "✓ devcontainer gitconfig already exists — skipping"
else
    echo "setting up devcontainer git config..."

    GIT_NAME=$(git config --global user.name 2>/dev/null || echo "")
    GIT_EMAIL=$(git config --global user.email 2>/dev/null || echo "")

    if [ -n "${GIT_NAME}" ]; then
        echo "  Found git user.name: ${GIT_NAME}"
        read -rp "  Use this? [Y/n]: " USE_NAME
        USE_NAME="${USE_NAME:-Y}"
        [[ "${USE_NAME}" =~ ^[Yy]$ ]] || read -rp "  Enter git user.name: " GIT_NAME
    else
        read -rp "  Enter git user.name: " GIT_NAME
    fi

    if [ -n "${GIT_EMAIL}" ]; then
        echo "  Found git user.email: ${GIT_EMAIL}"
        read -rp "  Use this? [Y/n]: " USE_EMAIL
        USE_EMAIL="${USE_EMAIL:-Y}"
        [[ "${USE_EMAIL}" =~ ^[Yy]$ ]] || read -rp "  Enter git user.email: " GIT_EMAIL
    else
        read -rp "  Enter git user.email: " GIT_EMAIL
    fi

    cat > "${DEVCONTAINER_GITCONFIG}" << EOF
[core]
    pager = delta
quotePath = false

[interactive]
    diffFilter = delta --color-only

[delta]
    navigate = true
    dark = true
side-by-side = true
line-numbers = true

[merge]
    conflictstyle = zdiff3

[user]
    name = ${GIT_NAME}
    email = ${GIT_EMAIL}
    signingkey = /home/dev/.ssh/signing_key.pub
    useConfigOnly = true

[gpg]
    format = ssh

[commit]
    gpgsign = true

[tag]
    gpgsign = true

[gpg "ssh"]
    allowedSignersFile = /home/dev/.ssh/allowed_signers

[core]
    editor = vi

[init]
    defaultBranch = main
EOF
    chmod 600 "${DEVCONTAINER_GITCONFIG}"
    echo "✓ devcontainer gitconfig created"
fi

# ── Allowed signers file ─────────────────────────────────────────────────────
ALLOWED_SIGNERS="${DEVCONTAINER_DIR}/allowed_signers"

if [ -f "${ALLOWED_SIGNERS}" ]; then
    echo "✓ allowed_signers already exists — skipping"
else
    GIT_EMAIL=$(grep "email" "${DEVCONTAINER_GITCONFIG}" | awk '{print $3}' | head -1)
    SIGNING_PUB=$(cat "${DEVCONTAINER_SIGNING_KEY}.pub")
    echo "${GIT_EMAIL} ${SIGNING_PUB}" > "${ALLOWED_SIGNERS}"
    chmod 644 "${ALLOWED_SIGNERS}"
    echo "✓ allowed_signers created"
fi

# ── print next steps ───────────────────────────────────────────────────────
echo ""
echo "───────────────────────────────────────────────────────"
echo "Setup complete. One manual step required:"
echo ""
echo "Add the following as a SIGNING KEY in GitHub:"
echo "  GitHub → Settings → SSH and GPG keys → New SSH key → Key type: Signing"
echo ""
echo "  Public key to paste:"
echo ""
cat "${DEVCONTAINER_SIGNING_KEY}.pub"
echo ""
echo "───────────────────────────────────────────────────────"
