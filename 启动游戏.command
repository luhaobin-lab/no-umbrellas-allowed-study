#!/bin/zsh
cd -- "${0:A:h}"
if ! command -v node >/dev/null 2>&1; then
  if [[ -s "$HOME/.nvm/nvm.sh" ]]; then source "$HOME/.nvm/nvm.sh"; fi
fi
if [[ ! -d node_modules ]]; then npm ci || exit 1; fi
open 'http://127.0.0.1:5173/'
npm run dev
