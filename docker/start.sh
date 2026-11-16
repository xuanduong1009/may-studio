#!/bin/sh
# Container entry point. On the first start with a local SQLite file, create the tables and fill the
# store with the sample catalogue (no demo orders or accounts), then serve the production build.
set -e

case "$DATABASE_URL" in
  file:*)
    db="${DATABASE_URL#file:}"
    if [ ! -f "$db" ]; then
      echo "First start: creating $db"
      # a half-created database would be mistaken for a ready one on the next start
      if ! (npx drizzle-kit push --force && npx tsx scripts/seed.ts --catalog); then
        rm -f "$db"
        exit 1
      fi
    fi
    ;;
esac

exec npx next start -p "${PORT:-3000}"
