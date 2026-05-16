#!/usr/bin/env bash
# 通过 /api/sessions 接口生成假数据，覆盖过去 14 天的专注会话。
# 用法： ./scripts/seed-fake-sessions.sh [user_token]
#  默认使用 user-123（前端兜底用户）。

set -euo pipefail

USER_TOKEN="${1:-user-123}"
API_BASE="${API_BASE:-http://localhost:8000/api}"

THEMES=("English" "408" "Math" "Momonga Focus" "Kurimanju Drink")
DURATIONS_MIN=(15 25 30 45 60)
PERSONAS=("gentle_encourager" "strict_coach" "logical_analyst" "humorous_buddy")

# 简单的随机选择
pick() {
  local arr=("$@")
  echo "${arr[$((RANDOM % ${#arr[@]}))]}"
}

# 取 YYYY-MM-DD 形式 N 天前的日期（macOS / GNU 兼容）
date_days_ago() {
  local days="$1"
  if date -v-1d +%F >/dev/null 2>&1; then
    date -v-"${days}"d +%F
  else
    date -d "${days} days ago" +%F
  fi
}

count=0
for d in $(seq 0 13); do
  day=$(date_days_ago "$d")
  # 每天 0-4 个会话
  sessions_today=$((RANDOM % 5))
  for _ in $(seq 1 "$sessions_today"); do
    theme=$(pick "${THEMES[@]}")
    dur_min=$(pick "${DURATIONS_MIN[@]}")
    dur_sec=$((dur_min * 60))
    persona=$(pick "${PERSONAS[@]}")

    # 时间：当天 9:00 ~ 21:00 之间随机点；start_time = base, end_time = base + duration
    hour=$((9 + RANDOM % 12))
    minute=$((RANDOM % 60))
    start_iso="${day}T$(printf '%02d:%02d:00Z' "$hour" "$minute")"
    # 计算 end_time（这里偷懒，直接拼接 hour+duration，越界由后端容忍）
    end_hour=$(( hour + (minute + dur_min) / 60 ))
    end_minute=$(( (minute + dur_min) % 60 ))
    if (( end_hour > 23 )); then end_hour=23; end_minute=59; fi
    end_iso="${day}T$(printf '%02d:%02d:00Z' "$end_hour" "$end_minute")"

    payload=$(cat <<EOF
{
  "theme_name": "${theme}",
  "duration_seconds": ${dur_sec},
  "phase_type": "focus",
  "status": "completed",
  "start_time": "${start_iso}",
  "end_time": "${end_iso}",
  "ai_persona": "${persona}"
}
EOF
)

    http_code=$(curl -s -o /tmp/seed-resp.json -w '%{http_code}' \
      -X POST "${API_BASE}/sessions" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${USER_TOKEN}" \
      -d "${payload}")

    if [[ "$http_code" != "200" && "$http_code" != "201" ]]; then
      echo "FAIL [$http_code] day=$day theme=$theme"
      cat /tmp/seed-resp.json
      echo
    else
      count=$((count + 1))
      echo "OK day=$day theme=$theme dur=${dur_min}m"
    fi
  done
done

echo
echo "Seeded ${count} sessions for user '${USER_TOKEN}'."
