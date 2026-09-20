#!/usr/bin/env sh
# Normalize a .env / secrets file for Docker --env-file.
# Docker keeps surrounding quotes on values; Node dotenv strips them.
# Usage: normalize-docker-env.sh <input.env> <output.env>

set -eu

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <input.env> <output.env>" >&2
  exit 1
fi

INPUT="$1"
OUTPUT="$2"

if [ ! -f "$INPUT" ]; then
  echo "ERROR: input file missing: $INPUT" >&2
  exit 1
fi

# Strip one layer of surrounding single or double quotes from values.
# Uses ASCII 39 for single-quote so this file stays free of nested '\'' quoting.
awk -F= '
  BEGIN { sq = sprintf("%c", 39) }
  /^[[:space:]]*#/ || NF < 2 { print; next }
  {
    key = $1
    val = substr($0, index($0, "=") + 1)
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", key)
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", val)
    first = substr(val, 1, 1)
    last  = substr(val, length(val), 1)
    if (length(val) >= 2 && ((first == "\"" && last == "\"") || (first == sq && last == sq))) {
      val = substr(val, 2, length(val) - 2)
    }
    print key "=" val
  }
' "$INPUT" > "$OUTPUT"
