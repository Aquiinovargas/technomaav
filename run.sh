#!/usr/bin/env bash
# Sirve la PWA en http://localhost:8080 (localhost cuenta como origen seguro)
cd "$(dirname "$0")"
exec python3 -m http.server 8080
