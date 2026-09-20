-- Yoga Studio schema. Reuses a dedicated users/roles model; do not duplicate
-- Hire/OBO tables. This app is a standalone service with its own database.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(191) NOT NULL,
  locale VARCHAR(16) NOT NULL DEFAULT 'en',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  description VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, role_id),
  KEY idx_user_roles_role (role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS instructor_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  display_name VARCHAR(191) NOT NULL,
  bio TEXT NULL,
  specialties VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_instructor_user (user_id),
  CONSTRAINT fk_instructor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS yoga_styles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_yoga_styles_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS yoga_goals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_yoga_goals_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS yoga_poses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(96) NOT NULL,
  name VARCHAR(191) NOT NULL,
  sanskrit_name VARCHAR(191) NULL,
  category VARCHAR(64) NOT NULL,
  difficulty VARCHAR(32) NOT NULL DEFAULT 'beginner',
  description TEXT NULL,
  instructions TEXT NULL,
  breathing_guidance TEXT NULL,
  caution_notes TEXT NULL,
  image_url VARCHAR(512) NULL,
  video_url VARCHAR(512) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_yoga_poses_slug (slug),
  KEY idx_yoga_poses_category (category),
  KEY idx_yoga_poses_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS yoga_classes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  instructor_user_id BIGINT UNSIGNED NOT NULL,
  instructor_display_name VARCHAR(191) NOT NULL,
  title VARCHAR(255) NULL,
  description TEXT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  level VARCHAR(32) NOT NULL,
  style_id BIGINT UNSIGNED NULL,
  goal_id BIGINT UNSIGNED NULL,
  language VARCHAR(16) NOT NULL DEFAULT 'en',
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  is_daily TINYINT(1) NOT NULL DEFAULT 0,
  plan_json JSON NULL,
  script_json JSON NULL,
  script_manually_edited TINYINT(1) NOT NULL DEFAULT 0,
  objectives TEXT NULL,
  safety_guidance TEXT NULL,
  published_at DATETIME NULL,
  approved_by BIGINT UNSIGNED NULL,
  rejected_reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_classes_instructor (instructor_user_id),
  KEY idx_classes_status (status),
  KEY idx_classes_level (level),
  KEY idx_classes_duration (duration_minutes),
  KEY idx_classes_style (style_id),
  KEY idx_classes_goal (goal_id),
  KEY idx_classes_language (language),
  KEY idx_classes_published (published_at),
  CONSTRAINT fk_classes_instructor FOREIGN KEY (instructor_user_id) REFERENCES users(id),
  CONSTRAINT fk_classes_style FOREIGN KEY (style_id) REFERENCES yoga_styles(id),
  CONSTRAINT fk_classes_goal FOREIGN KEY (goal_id) REFERENCES yoga_goals(id),
  CONSTRAINT fk_classes_approved_by FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS yoga_class_sequences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NOT NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  generated_by VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sequences_class (class_id),
  CONSTRAINT fk_sequences_class FOREIGN KEY (class_id) REFERENCES yoga_classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS yoga_class_sequence_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sequence_id BIGINT UNSIGNED NOT NULL,
  pose_id BIGINT UNSIGNED NULL,
  sort_order INT UNSIGNED NOT NULL,
  item_type VARCHAR(32) NOT NULL DEFAULT 'pose',
  name VARCHAR(191) NOT NULL,
  sanskrit_name VARCHAR(191) NULL,
  duration_seconds INT UNSIGNED NOT NULL DEFAULT 60,
  instructions TEXT NULL,
  breathing_guidance TEXT NULL,
  transition TEXT NULL,
  instructor_note TEXT NULL,
  scene_label VARCHAR(191) NULL,
  manually_edited TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_seq_items_sequence (sequence_id, sort_order),
  KEY idx_seq_items_pose (pose_id),
  CONSTRAINT fk_seq_items_sequence FOREIGN KEY (sequence_id) REFERENCES yoga_class_sequences(id) ON DELETE CASCADE,
  CONSTRAINT fk_seq_items_pose FOREIGN KEY (pose_id) REFERENCES yoga_poses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS class_media_assets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NOT NULL,
  sequence_item_id BIGINT UNSIGNED NULL,
  asset_type VARCHAR(32) NOT NULL,
  provider VARCHAR(64) NOT NULL,
  provider_asset_id VARCHAR(191) NULL,
  storage_url VARCHAR(1024) NULL,
  thumbnail_url VARCHAR(1024) NULL,
  duration_seconds INT UNSIGNED NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  metadata_json JSON NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_assets_class_type (class_id, asset_type),
  KEY idx_assets_item (sequence_item_id),
  KEY idx_assets_status (status),
  CONSTRAINT fk_assets_class FOREIGN KEY (class_id) REFERENCES yoga_classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_assets_item FOREIGN KEY (sequence_item_id) REFERENCES yoga_class_sequence_items(id) ON DELETE SET NULL,
  CONSTRAINT fk_assets_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS generation_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(64) NOT NULL,
  asset_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
  progress TINYINT UNSIGNED NOT NULL DEFAULT 0,
  retry_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  provider_job_id VARCHAR(191) NULL,
  input_json JSON NULL,
  output_json JSON NULL,
  error_code VARCHAR(64) NULL,
  error_message TEXT NULL,
  technical_error TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_jobs_class (class_id),
  KEY idx_jobs_user (user_id),
  KEY idx_jobs_status (status),
  KEY idx_jobs_asset (asset_type),
  CONSTRAINT fk_jobs_class FOREIGN KEY (class_id) REFERENCES yoga_classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_jobs_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS class_schedules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NOT NULL,
  instructor_user_id BIGINT UNSIGNED NOT NULL,
  starts_at DATETIME NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  visibility VARCHAR(32) NOT NULL DEFAULT 'public',
  max_participants INT UNSIGNED NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_schedules_starts (starts_at),
  KEY idx_schedules_class (class_id),
  KEY idx_schedules_instructor (instructor_user_id),
  CONSTRAINT fk_schedules_class FOREIGN KEY (class_id) REFERENCES yoga_classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedules_instructor FOREIGN KEY (instructor_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS class_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NOT NULL,
  schedule_id BIGINT UNSIGNED NULL,
  session_date DATE NOT NULL,
  starts_at DATETIME NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'scheduled',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_session_class_date (class_id, session_date),
  KEY idx_sessions_date (session_date),
  CONSTRAINT fk_sessions_class FOREIGN KEY (class_id) REFERENCES yoga_classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_schedule FOREIGN KEY (schedule_id) REFERENCES class_schedules(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS class_participants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NOT NULL,
  session_id BIGINT UNSIGNED NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'JOINED',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  completion_percentage TINYINT UNSIGNED NOT NULL DEFAULT 0,
  duration_watched_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  feedback TEXT NULL,
  rating TINYINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_participant_session (student_user_id, class_id, session_id),
  KEY idx_participants_class (class_id),
  KEY idx_participants_status (status),
  CONSTRAINT fk_participants_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_participants_class FOREIGN KEY (class_id) REFERENCES yoga_classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_participants_session FOREIGN KEY (session_id) REFERENCES class_sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_class_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NOT NULL,
  participant_id BIGINT UNSIGNED NULL,
  completed_at DATETIME NULL,
  duration_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_history_student (student_user_id, completed_at),
  CONSTRAINT fk_history_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_class FOREIGN KEY (class_id) REFERENCES yoga_classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_participant FOREIGN KEY (participant_id) REFERENCES class_participants(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NULL,
  entity_type VARCHAR(64) NULL,
  entity_id BIGINT UNSIGNED NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id, is_read, created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  metadata_json JSON NULL,
  ip_address VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_entity (entity_type, entity_id),
  KEY idx_audit_user (user_id),
  KEY idx_audit_action (action),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  filename VARCHAR(255) NOT NULL,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_schema_migrations_filename (filename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
