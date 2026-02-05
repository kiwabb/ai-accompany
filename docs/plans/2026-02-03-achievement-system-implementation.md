# Achievement System Development Roadmap

## Phase 1: Foundation & Data Model (Backend)
- [ ] **Database Migration**:
    - Create `Achievement` table (Static Config).
    - Create `UserAchievement` table (User Progress).
- [ ] **Schemas & CRUD**:
    - Define Pydantic schemas in `backend/schemas.py`.
    - Implement basic CRUD operations in `backend/crud.py`.
- [ ] **Initial Seeding**:
    - Create a script or add to `seed.py` to populate initial achievements (e.g., "First Session", "10 Hours Focus").

## Phase 2: Achievement Logic (Backend)
- [ ] **Achievement Service**:
    - Create `backend/services/achievement_service.py`.
    - Implement `check_achievements(user_id, event_type, context)` logic.
    - Handle progress increments and status updates.
- [ ] **Trigger Integration**:
    - Integrate `AchievementService` into `backend/routers/sessions.py` using FastAPI `BackgroundTasks`.
    - (Optional) Integrate into chat and task completion.

## Phase 3: API & Notifications (Backend & Frontend)
- [ ] **API Router**:
    - Create `backend/routers/achievements.py`.
    - `GET /api/achievements`: List achievements with user progress.
    - `GET /api/achievements/latest-unlocks`: Polling endpoint for notifications.
- [ ] **Frontend Client**:
    - Update `frontend/src/api/client.ts` with new achievement endpoints.

## Phase 4: UI & Feedback (Frontend)
- [ ] **Achievement Notification**:
    - Create `AchievementToast` component.
    - Implement polling logic in `CozyPal.tsx` to detect new unlocks.
- [ ] **Achievement Wall**:
    - Create `AchievementWall.tsx` page to display all achievements.
    - Add entry point in the Sidebar or Settings.
- [ ] **Visual Polish**:
    - Add Framer Motion animations for unlocking.

## Phase 5: Verification & Testing
- [ ] **Unit Tests**:
    - Test achievement unlocking logic in `backend/tests`.
- [ ] **Integration Tests**:
    - Verify that completing a session correctly triggers the achievement check.
