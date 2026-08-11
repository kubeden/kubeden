#!/usr/bin/env bash
#
# Symlink the configs in this directory into $HOME.
#
#   ./configs/install.sh            # link everything
#   ./configs/install.sh --dry-run  # show what it would do, touch nothing
#
# Safe to re-run: links that already point here are left alone, and anything
# else already sitting at a target path is moved to <path>.backup-<timestamp>
# before the link is made. Nothing is ever deleted.

set -euo pipefail

CONFIGS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
DRY_RUN=0

[[ "${1:-}" == "--dry-run" || "${1:-}" == "-n" ]] && DRY_RUN=1

say() { printf '%s\n' "$*"; }
run() { if (( DRY_RUN )); then say "    would: $*"; else "$@"; fi; }

link() {
  local src="$CONFIGS/$1" dest="$HOME/$2"

  if [[ ! -e "$src" ]]; then
    say "  !! $2 — missing in repo ($1), skipped"
    return
  fi

  if [[ -L "$dest" && "$(readlink "$dest")" == "$src" ]]; then
    say "  ok $2"
    return
  fi

  run mkdir -p "$(dirname "$dest")"

  if [[ -e "$dest" || -L "$dest" ]]; then
    say "  -> $2 (backed up to $2.backup-$STAMP)"
    run mv "$dest" "$dest.backup-$STAMP"
  else
    say "  -> $2"
  fi

  run ln -sn "$src" "$dest"
}

(( DRY_RUN )) && say "dry run — nothing will be changed"
say "linking from $CONFIGS"

link zsh/zshrc              .zshrc
link zsh/zprofile           .zprofile
link zsh/zshenv             .zshenv
link zsh/p10k.zsh           .p10k.zsh
link tmux/tmux.conf         .tmux.conf
link git/gitconfig          .gitconfig
link kitty                  .config/kitty
link nvim                   .config/nvim
link bin/tmux-git-ssh-key   .local/bin/tmux-git-ssh-key

(( DRY_RUN )) || chmod +x "$CONFIGS/bin/tmux-git-ssh-key"

cat <<'EOF'

On a brand new machine, these come first — the oh-my-zsh installer writes its
own ~/.zshrc, so do them and then re-run this script:

  brew install tmux neovim fzf zoxide direnv git-lfs
  brew install --cask kitty git-credential-manager font-monaspice-nerd-font
  sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
  git clone --depth=1 https://github.com/romkatv/powerlevel10k \
      "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k"
  git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

The powerlevel10k clone is not optional — oh-my-zsh doesn't ship the theme, and
zshrc asks for it by name. The prompt itself is zsh/p10k.zsh in this repo, so
there's no need to run `p10k configure`; it would delete the symlink this
script just made and write a fresh config over it.

Then: tmux + prefix-I for plugins, nvim once to let lazy sync.
Secrets and per-machine env go in ~/.config/secret_env (not in this repo).
EOF
