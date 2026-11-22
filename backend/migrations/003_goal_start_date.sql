-- 003_goal_start_date.sql: remembers the day each goal was set.
-- Goal progress counts only the workouts from that day on (RQ13), so a new goal starts at 0.
-- Goals made before this migration have no start_date (NULL) and keep counting all workouts.
ALTER TABLE goals ADD COLUMN start_date TEXT;
