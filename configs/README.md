# Dotfiles / Configs

Personal machine setup: zsh (Oh My Zsh + Powerlevel10k), tmux, neovim, kitty,
git.

## Contents

```
configs/
├── install.sh              # symlinks everything below into $HOME
├── zsh/
│   ├── zshrc               # → ~/.zshrc
│   ├── zprofile            # → ~/.zprofile
│   └── zshenv              # → ~/.zshenv
├── tmux/
│   └── tmux.conf           # → ~/.tmux.conf
├── git/
│   └── gitconfig           # → ~/.gitconfig
├── nvim/                   # → ~/.config/nvim
├── kitty/
│   ├── kitty.conf          # → ~/.config/kitty
│   └── theme.conf          #   (3024 Night)
└── bin/
    └── tmux-git-ssh-key    # → ~/.local/bin/ — shows which ssh key a repo uses
```

## Install

On a fresh mac, in this order:

```sh
# 1. dependencies — oh-my-zsh writes its own ~/.zshrc, so it goes first
brew install tmux neovim fzf zoxide direnv git-lfs
brew install --cask kitty git-credential-manager
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
git clone --depth=1 https://github.com/romkatv/powerlevel10k \
    "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k"
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

# 2. the configs
git clone https://github.com/kubeden/kubeden.git ~/Developer/kubeden/kubeden
~/Developer/kubeden/kubeden/configs/install.sh
```

`install.sh --dry-run` prints what it would do without touching anything. It's
safe to re-run: links already pointing here are left alone, and anything else
at a target path is moved to `<path>.backup-<timestamp>` first. It never
deletes.

Then: `p10k configure`, start tmux and hit `prefix + I` to install plugins, and
open nvim once to let lazy.nvim sync from `nvim/lazy-lock.json`.

## Notes

- **nvim** is a [kickstart.nvim](https://github.com/nvim-lua/kickstart.nvim)
  fork with `lua/custom/plugins/` (emmet, oil, hardtime) and a small diffium
  integration on top. Because `~/.config/nvim` is a symlink into this repo,
  lazy.nvim updating `lazy-lock.json` shows up as a change here — commit it,
  that's the point.
- **kitty** ships the resolved theme rather than the whole
  [kitty-themes](https://github.com/dexpota/kitty-themes) checkout. To browse
  others, clone that repo into `~/.config/kitty/kitty-themes` and repoint
  `theme.conf`.
- **git** uses `credential.helper = manager`, resolved from `PATH` so it works
  on both Intel and Apple Silicon homebrew prefixes.
- **tmux** status-left calls `bin/tmux-git-ssh-key`, which reports the ssh key
  the current repo's remote resolves to via `~/.ssh/config` / `ssh -G`.

## Machine-specific / secrets

These files are portable — no secrets, nothing tied to one machine or host.
Anything personal lives outside the repo:

- Secrets, machine-specific env vars and ssh host aliases go in
  `~/.config/secret_env`, which `zshrc` sources at the end if present. Keep
  that file out of version control.
- The Powerlevel10k config (`~/.p10k.zsh`) is machine-generated; regenerate it
  with `p10k configure` rather than committing it.
- `~/.ssh/`, keys and tokens are never in here.
