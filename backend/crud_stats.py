from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from . import models, schemas
from datetime import date
from typing import Dict, Optional


async def get_daily_stats(
    db: AsyncSession, target_date: date
) -> Optional[schemas.DailyStats]:
    # 计算总专注分钟数 (只计算 phase_type == 'focus' 的 session)
    total_focus_seconds_result = await db.execute(
        select(func.sum(models.LearningSession.duration_seconds)).where(
            func.date(models.LearningSession.start_time) == target_date,
            models.LearningSession.phase_type == "focus",
        )
    )
    total_focus_seconds = total_focus_seconds_result.scalar_one_or_none() or 0
    total_focus_minutes = round(total_focus_seconds / 60)

    # 计算总会话数 (所有类型的 session)
    total_sessions_result = await db.execute(
        select(func.count(models.LearningSession.id)).where(
            func.date(models.LearningSession.start_time) == target_date
        )
    )
    total_sessions = total_sessions_result.scalar_one_or_none() or 0

    # 按主题统计专注分钟数
    sessions_by_theme_result = await db.execute(
        select(
            models.LearningSession.theme_name,
            func.sum(models.LearningSession.duration_seconds).label("total_seconds"),
        )
        .where(
            func.date(models.LearningSession.start_time) == target_date,
            models.LearningSession.phase_type == "focus",
        )
        .group_by(models.LearningSession.theme_name)
    )
    sessions_by_theme: Dict[str, int] = {
        row.theme_name: round(row.total_seconds / 60)
        for row in sessions_by_theme_result.all()
    }

    return schemas.DailyStats(
        date=target_date.isoformat(),
        total_focus_minutes=total_focus_minutes,
        total_sessions=total_sessions,
        sessions_by_theme=sessions_by_theme,
    )


async def get_stats_range(
    db: AsyncSession, user_id: str, start_date: date, end_date: date
) -> schemas.StatsRangeResponse:
    # 1. Get all sessions in range
    stmt = select(models.LearningSession).where(
        models.LearningSession.user_id == user_id,
        func.date(models.LearningSession.start_time) >= start_date,
        func.date(models.LearningSession.start_time) <= end_date,
    ).order_by(models.LearningSession.start_time.desc())

    result = await db.execute(stmt)
    sessions = list(result.scalars().all())

    # 2. Daily aggregation
    daily_stats_map = {}
    total_focus_seconds = 0
    total_sessions = len(sessions)
    theme_distribution = {}

    for session in sessions:
        d_str = session.start_time.date().isoformat()
        if d_str not in daily_stats_map:
            daily_stats_map[d_str] = {"focus_seconds": 0, "sessions": 0, "themes": {}}

        daily_stats_map[d_str]["sessions"] += 1

        if session.phase_type == "focus":
            daily_stats_map[d_str]["focus_seconds"] += session.duration_seconds
            total_focus_seconds += session.duration_seconds

            theme = session.theme_name
            daily_stats_map[d_str]["themes"][theme] = daily_stats_map[d_str]["themes"].get(theme, 0) + session.duration_seconds
            theme_distribution[theme] = theme_distribution.get(theme, 0) + session.duration_seconds

    daily_stats_list = []
    # Fill gaps with 0? No, for now just existing days
    for d_str, data in sorted(daily_stats_map.items()):
        daily_stats_list.append(schemas.DailyStats(
            date=d_str,
            total_focus_minutes=round(data["focus_seconds"] / 60),
            total_sessions=data["sessions"],
            sessions_by_theme={t: round(s / 60) for t, s in data["themes"].items()}
        ))

    return schemas.StatsRangeResponse(
        total_focus_minutes=round(total_focus_seconds / 60),
        total_sessions=total_sessions,
        daily_stats=daily_stats_list,
        sessions_by_theme={t: round(s / 60) for t, s in theme_distribution.items()},
        sessions_details=[schemas.SessionResponse.model_validate(s) for s in sessions]
    )
