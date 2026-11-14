<?php
// Structure de la base. Exécutée par install.php (CREATE TABLE IF NOT EXISTS : sans risque si relancée).
return [
"CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  email VARCHAR(190) NULL,
  password_hash VARCHAR(255) NULL,
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  can_login TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  pd_id BIGINT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY u_email (email), UNIQUE KEY u_pd (pd_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS pipelines (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  pd_id BIGINT NULL, UNIQUE KEY u_pd (pd_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS stages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pipeline_id INT UNSIGNED NOT NULL,
  name VARCHAR(190) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  pd_id BIGINT NULL, UNIQUE KEY u_pd (pd_id), KEY k_pipe (pipeline_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS orgs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) NULL,
  website VARCHAR(500) NULL,
  owner_id INT UNSIGNED NULL,
  notes TEXT NULL,
  extra LONGTEXT NULL,
  pd_id BIGINT NULL,
  add_time DATETIME NOT NULL,
  update_time DATETIME NOT NULL,
  UNIQUE KEY u_pd (pd_id), KEY k_name (name(60)), KEY k_upd (update_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS persons (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  first_name VARCHAR(190) NULL,
  last_name VARCHAR(190) NULL,
  org_id INT UNSIGNED NULL,
  emails TEXT NULL,
  phones TEXT NULL,
  owner_id INT UNSIGNED NULL,
  notes TEXT NULL,
  extra LONGTEXT NULL,
  pd_id BIGINT NULL,
  add_time DATETIME NOT NULL,
  update_time DATETIME NOT NULL,
  UNIQUE KEY u_pd (pd_id), KEY k_name (name(60)), KEY k_org (org_id), KEY k_upd (update_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS deals (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  value DECIMAL(14,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  pipeline_id INT UNSIGNED NULL,
  stage_id INT UNSIGNED NULL,
  status ENUM('open','won','lost') NOT NULL DEFAULT 'open',
  lost_reason VARCHAR(500) NULL,
  owner_id INT UNSIGNED NULL,
  org_id INT UNSIGNED NULL,
  person_id INT UNSIGNED NULL,
  expected_close_date DATE NULL,
  notes TEXT NULL,
  extra LONGTEXT NULL,
  pd_id BIGINT NULL,
  add_time DATETIME NOT NULL,
  update_time DATETIME NOT NULL,
  won_time DATETIME NULL, lost_time DATETIME NULL, close_time DATETIME NULL, stage_change_time DATETIME NULL,
  UNIQUE KEY u_pd (pd_id), KEY k_org (org_id), KEY k_person (person_id), KEY k_stage (stage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS activities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(40) NOT NULL DEFAULT 'task',
  subject VARCHAR(500) NOT NULL DEFAULT '',
  due_date DATE NULL,
  due_time CHAR(5) NULL,
  duration INT NULL,
  done TINYINT(1) NOT NULL DEFAULT 0,
  done_time DATETIME NULL,
  owner_id INT UNSIGNED NULL,
  deal_id INT UNSIGNED NULL,
  person_id INT UNSIGNED NULL,
  org_id INT UNSIGNED NULL,
  note MEDIUMTEXT NULL,
  location VARCHAR(500) NULL,
  pd_id BIGINT NULL,
  add_time DATETIME NOT NULL,
  update_time DATETIME NOT NULL,
  UNIQUE KEY u_pd (pd_id), KEY k_done (done, due_date), KEY k_deal (deal_id), KEY k_org (org_id), KEY k_person (person_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS fields (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity ENUM('deal','org','person') NOT NULL,
  fkey VARCHAR(80) NOT NULL,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'varchar',
  options TEXT NULL,
  position INT NOT NULL DEFAULT 0,
  UNIQUE KEY u_key (entity, fkey)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS settings (
  k VARCHAR(80) PRIMARY KEY,
  v MEDIUMTEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS login_attempts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(64) NOT NULL,
  at DATETIME NOT NULL,
  KEY k_ip (ip, at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
];
