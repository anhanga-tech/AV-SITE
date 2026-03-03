#!/bin/bash
# GitHub Project Metrics Script
# Usage: ./scripts/project-metrics.sh

PROJECT_NUMBER="5"
OWNER="felipewilliam2"
REPO="AV-SITE"

echo "📊 GitHub Project #5 Metrics"
echo "=============================="

# Count by status
echo ""
echo "📌 Issues by Status:"
gh project item-list $PROJECT_NUMBER --owner $OWNER --format json 2>/dev/null | jq -r '
  group_by(.fieldValues.Status) | 
  map({status: .[0].fieldValues.Status, count: length}) | 
  .[] | "  \(.status // "No Status"): \(.count)"
' 2>/dev/null || echo "  (Unable to fetch - API error)"

# Count by priority
echo ""
echo "🔥 Issues by Priority:"
gh project item-list $PROJECT_NUMBER --owner $OWNER --format json 2>/dev/null | jq -r '
  group_by(.fieldValues.Priority) | 
  map({priority: .[0].fieldValues.Priority, count: length}) | 
  .[] | "  \(.priority // "No Priority"): \(.count)"
' 2>/dev/null || echo "  (Unable to fetch - API error)"

# Total estimate
echo ""
echo "⏱️  Total Estimate (hours):"
gh project item-list $PROJECT_NUMBER --owner $OWNER --format json 2>/dev/null | jq -r '
  [.[].fieldValues.Estimate // 0] | add | "  Total: \(. // 0)h"
' 2>/dev/null || echo "  (Unable to fetch - API error)"

# Recent done
echo ""
echo "✅ Done This Week:"
gh issue list --repo $OWNER/$REPO --state closed --search "closed:>=$(date -v-7d +%Y-%m-%d)" --limit 10 --json number,title,closedAt | jq -r '.[] | "  #\(.number): \(.title)"' 2>/dev/null || echo "  (No recent closed issues)"

# Summary
echo ""
echo "=============================="
echo "📈 Quick Stats:"
echo "  - Open Issues: $(gh issue list --repo $OWNER/$REPO --state open --json number | jq 'length')"
echo "  - Closed (total): $(gh issue list --repo $OWNER/$REPO --state closed --json number | jq 'length')"
echo "  - PRs open: $(gh pr list --repo $OWNER/$REPO --json number | jq 'length')"