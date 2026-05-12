-- Home inventory MySQL 8 schema.
-- Current scope:
-- 1. One WeChat openid maps to one app user.
-- 2. No household sharing table in v1.
-- 3. No soft delete in v1; item and bill deletion is physical deletion.
-- 4. Revisit soft delete and operation logs before adding recycle bin,
--    mistake recovery, household sharing, or audit features.

CREATE TABLE app_users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_app_users_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE houses (
  id VARCHAR(64) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(1024) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_houses_user_order (user_id, sort_order, id),
  CONSTRAINT fk_houses_user FOREIGN KEY (user_id) REFERENCES app_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE house_locations (
  id VARCHAR(64) PRIMARY KEY,
  house_id VARCHAR(64) NOT NULL,
  name VARCHAR(50) NOT NULL,
  color CHAR(7) NOT NULL DEFAULT '#7fc8e8',
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_locations_house_name (house_id, name),
  KEY idx_locations_house_order (house_id, sort_order, id),
  CONSTRAINT fk_locations_house FOREIGN KEY (house_id) REFERENCES houses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE house_categories (
  id VARCHAR(64) PRIMARY KEY,
  house_id VARCHAR(64) NOT NULL,
  name VARCHAR(50) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_categories_house_name (house_id, name),
  KEY idx_categories_house_order (house_id, sort_order, id),
  CONSTRAINT fk_categories_house FOREIGN KEY (house_id) REFERENCES houses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE house_units (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  house_id VARCHAR(64) NOT NULL,
  name VARCHAR(30) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_units_house_name (house_id, name),
  KEY idx_units_house_order (house_id, sort_order, id),
  CONSTRAINT fk_units_house FOREIGN KEY (house_id) REFERENCES houses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inventory_items (
  id VARCHAR(64) PRIMARY KEY,
  house_id VARCHAR(64) NOT NULL,
  name VARCHAR(100) NOT NULL,
  image_url VARCHAR(1024) NOT NULL DEFAULT '',
  location_id VARCHAR(64) NOT NULL,
  category_id VARCHAR(64) NOT NULL,
  unit_id BIGINT UNSIGNED NOT NULL,
  location_detail JSON NOT NULL,
  manual_consumption DECIMAL(12,3) NOT NULL DEFAULT 0,
  stock_qty DECIMAL(12,3) NOT NULL DEFAULT 0,
  cycle_days INT NOT NULL DEFAULT 30,
  previous_purchase_date DATE NULL,
  last_purchase_date DATE NULL,
  next_suggested_date DATE NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_items_house_filter (house_id, location_id, category_id),
  KEY idx_items_house_reminder (house_id, stock_qty, next_suggested_date, id),
  KEY idx_items_house_name (house_id, name, id),
  CONSTRAINT fk_items_house FOREIGN KEY (house_id) REFERENCES houses(id),
  CONSTRAINT fk_items_location FOREIGN KEY (location_id) REFERENCES house_locations(id),
  CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES house_categories(id),
  CONSTRAINT fk_items_unit FOREIGN KEY (unit_id) REFERENCES house_units(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE bill_records (
  id VARCHAR(64) PRIMARY KEY,
  house_id VARCHAR(64) NOT NULL,
  item_id VARCHAR(64) NOT NULL,
  bill_date DATE NOT NULL,
  platform VARCHAR(30) NOT NULL,
  platform_detail VARCHAR(100) NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_bills_house_date (house_id, bill_date DESC, id DESC),
  KEY idx_bills_item_date (item_id, bill_date DESC, id DESC),
  KEY idx_bills_item_price (item_id, price, id),
  CONSTRAINT fk_bills_house FOREIGN KEY (house_id) REFERENCES houses(id),
  CONSTRAINT fk_bills_item FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE store_backups (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  app_version VARCHAR(30) NOT NULL,
  summary JSON NOT NULL,
  snapshot JSON NOT NULL,
  KEY idx_backups_user_created (user_id, created_at DESC, id DESC),
  CONSTRAINT fk_backups_user FOREIGN KEY (user_id) REFERENCES app_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
