#!/usr/bin/env bash
# Independent collectors own disjoint files on analytics-data. Rebase a rejected
# push so a concurrent publication keeps both sets of files. Never force-push.
set -euo pipefail
for attempt in 1 2 3; do
  if git push origin HEAD:analytics-data; then exit 0; fi
  git fetch origin analytics-data
  git rebase FETCH_HEAD
done
# The last rebase may have resolved the final race.
git push origin HEAD:analytics-data
