# Dotfiles / Configs

Personal terminal configuration: tmux and zsh (Oh My Zsh + Powerlevel10k).

## Contents

```
configs/
├── tmux/
│   └── tmux.conf      # → ~/.tmux.conf
└── zsh/
    ├── zshrc          # → ~/.zshrc
    ├── zprofile       # → ~/.zprofile
    └── zshenv         # → ~/.zshenv
```

## Install

Symlink (recommended, keeps the repo as source of truth):

```sh
ln -sf "$PWD/configs/tmux/tmux.conf" ~/.tmux.conf
ln -sf "$PWD/configs/zsh/zshrc"      ~/.zshrc
ln -sf "$PWD/configs/zsh/zprofile"   ~/.zprofile
ln -sf "$PWD/configs/zsh/zshenv"     ~/.zshenv
```

## Dependencies

- **zsh**: [Oh My Zsh](https://ohmyz.sh/), [Powerlevel10k](https://github.com/romkatv/powerlevel10k)
  theme. Optional tools auto-detected if installed: `zoxide`, `direnv`, `fzf`,
  `nvm`, `conda`, `gcloud`, `pyenv`, `pnpm`.
- **tmux**: [TPM](https://github.com/tmux-plugins/tpm) (plugin manager). Run
  `prefix + I` after first launch to install plugins. Theme is `nord-tmux`.

## Machine-specific / secrets

These files are meant to be portable — no secrets and nothing tied to a specific
machine or host. Anything personal lives outside the repo:

- Secrets and machine-specific env vars go in `~/.config/secret_env`, which `zshrc`
  sources at the end if present. Keep that file out of version control.
- The Powerlevel10k config (`~/.p10k.zsh`) is machine-generated; regenerate it
  with `p10k configure` rather than committing it.
