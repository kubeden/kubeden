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
│   ├── zshenv              # → ~/.zshenv
│   └── p10k.zsh            # → ~/.p10k.zsh — the two-line prompt
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
brew install --cask kitty git-credential-manager font-monaspice-nerd-font
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# 2. powerlevel10k — oh-my-zsh does NOT ship it, and zshrc asks for it by name
git clone --depth=1 https://github.com/romkatv/powerlevel10k \
    "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k"
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

# 3. the configs
git clone https://github.com/kubeden/kubeden.git ~/Developer/kubeden/kubeden
~/Developer/kubeden/kubeden/configs/install.sh
```

`install.sh --dry-run` prints what it would do without touching anything. It's
safe to re-run: links already pointing here are left alone, and anything else
at a target path is moved to `<path>.backup-<timestamp>` first. It never
deletes.

Then: start tmux and hit `prefix + I` to install plugins, and open nvim once to
let lazy.nvim sync from `nvim/lazy-lock.json`. The prompt is already configured
— don't run `p10k configure` (see below).

## Notes

- **the prompt** is Powerlevel10k, `zsh/p10k.zsh` — two lines with the
  `┌─` / `│` / `└─` frame down the left, path and git status up top, exit code
  / timing / venv / conda / nvm / kube-context on the right of the first line.
  It takes both halves: the theme clone in step 2 (oh-my-zsh doesn't bundle
  it — this is the one people miss) and this config file.
- **don't run `p10k configure`** once `install.sh` has run. The wizard deletes
  `~/.p10k.zsh` and writes a fresh file, which throws away the symlink — you'd
  keep the new prompt and silently stop tracking it here. To redo the prompt:
  run it, copy the result back over `zsh/p10k.zsh`, commit, re-run
  `install.sh`.
- **fonts** — the config is `POWERLEVEL9K_MODE=nerdfont-v3`, so the icons need
  a Nerd Font. kitty bundles a Nerd Font symbol fallback and renders them with
  no font set at all, which is why `kitty.conf` doesn't name one. Anywhere
  else (Terminal.app, iTerm2, VS Code) install one and select it —
  `font-monaspice-nerd-font` in step 1 is what this machine has, and the
  `p10k configure` wizard offers to install MesloLGS NF instead. No font files
  in this repo.
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
- `~/.ssh/`, keys and tokens are never in here.
- `zsh/p10k.zsh` carries one custom segment, `prompt_git_auth`, which reads the
  ssh host alias of the current repo's remote (`github-kubeden` and friends,
  defined in `~/.ssh/config`) and the matching identity from
  `~/.config/gctx/profiles`. Both of those live outside this repo. The segment
  is defined but not enabled — it's in neither prompt-elements list.
