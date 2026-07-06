-- Caumas Event Manager — MySQL Schema
-- Run this in cPanel phpMyAdmin or mysql CLI after creating your database.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Users & authentication
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'event_admin', 'volunteer', 'scanner', 'attendee') NOT NULL DEFAULT 'scanner',
  full_name VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  password_reset_token VARCHAR(255) NULL,
  password_reset_expires DATETIME NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role),
  CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT NULL,
  qr_prefix VARCHAR(50) NOT NULL DEFAULT 'JATRA-VOL',
  start_date DATE NULL,
  end_date DATE NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  user_id INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_events_slug (slug),
  KEY idx_events_active (is_active),
  CONSTRAINT fk_events_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_events_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_events_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Volunteers (linked to JSON pass IDs — external_pass_id matches JATRA-VOL-001)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS volunteers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED NOT NULL,
  external_pass_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  team VARCHAR(100) NULL,
  role VARCHAR(100) NULL,
  user_id INT UNSIGNED NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_volunteers_pass (event_id, external_pass_id),
  KEY idx_volunteers_event (event_id),
  CONSTRAINT fk_volunteers_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_volunteers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_volunteers_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_volunteers_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Attendees (general event attendees / activity pass holders)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS attendees (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED NOT NULL,
  external_pass_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  pass_type ENUM('volunteer', 'activity', 'guest') NOT NULL DEFAULT 'volunteer',
  activity_type VARCHAR(50) NULL,
  volunteer_id INT UNSIGNED NULL,
  user_id INT UNSIGNED NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attendees_pass (event_id, external_pass_id),
  KEY idx_attendees_event (event_id),
  KEY idx_attendees_volunteer (volunteer_id),
  CONSTRAINT fk_attendees_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendees_volunteer FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE SET NULL,
  CONSTRAINT fk_attendees_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_attendees_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_attendees_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Registrations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS registrations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED NOT NULL,
  attendee_id INT UNSIGNED NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'checked_in') NOT NULL DEFAULT 'confirmed',
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INT UNSIGNED NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_registrations_event (event_id),
  KEY idx_registrations_attendee (attendee_id),
  KEY idx_registrations_status (status),
  CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_registrations_attendee FOREIGN KEY (attendee_id) REFERENCES attendees(id) ON DELETE CASCADE,
  CONSTRAINT fk_registrations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_registrations_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_registrations_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Pass status (replaces Firebase / localStorage status)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pass_status (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED NOT NULL,
  external_pass_id VARCHAR(50) NOT NULL,
  attendance_days TINYINT UNSIGNED NOT NULL DEFAULT 0,
  breakfast_used TINYINT UNSIGNED NOT NULL DEFAULT 0,
  lunch_used TINYINT UNSIGNED NOT NULL DEFAULT 0,
  dinner_used TINYINT UNSIGNED NOT NULL DEFAULT 0,
  breakfast TINYINT(1) NOT NULL DEFAULT 0,
  lunch TINYINT(1) NOT NULL DEFAULT 0,
  dinner TINYINT(1) NOT NULL DEFAULT 0,
  kit_received TINYINT(1) NOT NULL DEFAULT 0,
  certificate_received TINYINT(1) NOT NULL DEFAULT 0,
  entry_verified TINYINT(1) NOT NULL DEFAULT 0,
  user_id INT UNSIGNED NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pass_status (event_id, external_pass_id),
  CONSTRAINT fk_pass_status_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_pass_status_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_pass_status_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_pass_status_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Attendance logs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS attendance_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED NOT NULL,
  attendee_id INT UNSIGNED NULL,
  external_pass_id VARCHAR(50) NOT NULL,
  scanner_user_id INT UNSIGNED NOT NULL,
  check_in_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  check_out_at DATETIME NULL,
  is_duplicate TINYINT(1) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  user_id INT UNSIGNED NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_attendance_event (event_id),
  KEY idx_attendance_pass (external_pass_id),
  KEY idx_attendance_scanner (scanner_user_id),
  KEY idx_attendance_checkin (check_in_at),
  CONSTRAINT fk_attendance_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_attendee FOREIGN KEY (attendee_id) REFERENCES attendees(id) ON DELETE SET NULL,
  CONSTRAINT fk_attendance_scanner FOREIGN KEY (scanner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_attendance_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_attendance_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Meal logs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS meal_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED NOT NULL,
  attendee_id INT UNSIGNED NULL,
  external_pass_id VARCHAR(50) NOT NULL,
  meal_type ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
  scanner_user_id INT UNSIGNED NOT NULL,
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_duplicate TINYINT(1) NOT NULL DEFAULT 0,
  result ENUM('approved', 'already_collected', 'no_passes', 'not_found', 'error') NOT NULL,
  message VARCHAR(500) NULL,
  user_id INT UNSIGNED NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_meal_event (event_id),
  KEY idx_meal_pass (external_pass_id),
  KEY idx_meal_scanner (scanner_user_id),
  KEY idx_meal_collected (collected_at),
  CONSTRAINT fk_meal_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_meal_attendee FOREIGN KEY (attendee_id) REFERENCES attendees(id) ON DELETE SET NULL,
  CONSTRAINT fk_meal_scanner FOREIGN KEY (scanner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_meal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_meal_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_meal_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- QR scan logs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS scan_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED NOT NULL,
  external_pass_id VARCHAR(50) NOT NULL,
  scan_type ENUM('entry', 'meal', 'activity', 'verify', 'manual') NOT NULL DEFAULT 'entry',
  scanner_user_id INT UNSIGNED NULL,
  raw_payload TEXT NULL,
  result ENUM('valid', 'invalid', 'duplicate', 'not_found') NOT NULL,
  attendee_id INT UNSIGNED NULL,
  message VARCHAR(500) NULL,
  scanned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INT UNSIGNED NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_scan_event (event_id),
  KEY idx_scan_pass (external_pass_id),
  KEY idx_scan_scanner (scanner_user_id),
  KEY idx_scan_scanned (scanned_at),
  CONSTRAINT fk_scan_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_scan_attendee FOREIGN KEY (attendee_id) REFERENCES attendees(id) ON DELETE SET NULL,
  CONSTRAINT fk_scan_scanner FOREIGN KEY (scanner_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_scan_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_scan_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_scan_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Audit logs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED NULL,
  user_id INT UNSIGNED NULL,
  action ENUM(
    'login', 'logout', 'registration', 'attendance', 'meal_collection',
    'qr_validation', 'status_update', 'password_reset', 'admin_action'
  ) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id VARCHAR(100) NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_audit_user (user_id),
  KEY idx_audit_event (event_id),
  KEY idx_audit_action (action),
  KEY idx_audit_created (created_at),
  CONSTRAINT fk_audit_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Login history (volunteer activity tracking)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS login_history (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  login_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  logout_at DATETIME NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_login_user (user_id),
  CONSTRAINT fk_login_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_login_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_login_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
