#!/usr/bin/env bash
# Junta todo el feedback de un PR en una sola salida: metadatos, revisiones, comentarios
# generales, comentarios en línea (con su id para responder en el hilo) y checks de CI.
# Uso: bash .agents/skills/responder-pr/recoger.sh <número-de-PR>
set -euo pipefail

PR="${1:?Uso: recoger.sh <número-de-PR>}"
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

echo "════ PR #$PR ($REPO)"
gh pr view "$PR" --json title,state,isDraft,baseRefName,headRefName,reviewDecision,labels,url \
  --jq '"\(.title)\n\(.url)\nestado: \(.state)\(if .isDraft then " (borrador)" else "" end) · \(.headRefName) → \(.baseRefName)\ndecisión: \(.reviewDecision // "sin revisión") · etiquetas: \([.labels[].name] | join(", "))"'

echo
echo "════ Revisiones con texto"
gh pr view "$PR" --json reviews --jq '
  [.reviews[] | select(.body != "" and (.author.login | test("copilot") | not))]
  | if length == 0 then "(ninguna)" else .[] | "— \(.author.login) [\(.state)] \(.submittedAt[0:16])\n\(.body)\n" end'

echo "════ Comentarios generales"
gh pr view "$PR" --json comments --jq '
  if (.comments | length) == 0 then "(ninguno)" else .comments[] | "— \(.author.login) \(.createdAt[0:16])\n\(.body)\n" end'

echo "════ Comentarios en línea (id → para responder en el hilo)"
gh api "repos/$REPO/pulls/$PR/comments" --paginate --jq '
  if length == 0 then "(ninguno)" else .[] |
  "— id=\(.id)\(if .in_reply_to_id then " (respuesta a \(.in_reply_to_id))" else "" end) · \(.user.login) · \(.path):\(.line // .original_line) · \(.created_at[0:16])\n\(.body)\n" end'

echo "════ Checks de CI"
CHECKS=$(gh pr checks "$PR" 2>/dev/null || true)
if [ -z "$CHECKS" ]; then
  echo "(sin checks)"
else
  printf '%s\n' "$CHECKS" | awk -F'\t' '{ printf "%-28s %-9s %s\n", $1, $2, $4 }'
fi

echo
echo "════ Rama local vs. remota"
HEAD_REF=$(gh pr view "$PR" --json headRefName -q .headRefName)
REMOTE_SHA=$(gh pr view "$PR" --json headRefOid -q '.headRefOid[0:7]')
LOCAL_SHA=$(git rev-parse --short "$HEAD_REF" 2>/dev/null || echo "no existe en local")
echo "$HEAD_REF · local $LOCAL_SHA · remoto $REMOTE_SHA"
[ "$LOCAL_SHA" != "$REMOTE_SHA" ] && echo "⚠ Difieren: traer la rama remota antes de corregir (git fetch y revisar con git diff; no usar reset --hard si hay trabajo local propio)."
exit 0
