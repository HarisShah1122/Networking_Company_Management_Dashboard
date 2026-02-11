-- Create Sessions table for express-session-sequelize
CREATE TABLE IF NOT EXISTS `Sessions` (
  `sid` VARCHAR(255) NOT NULL,
  `userId` VARCHAR(255) DEFAULT NULL,
  `data` TEXT NOT NULL,
  `expires` DATETIME NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`sid`),
  INDEX `sessions_sid` (`sid`),
  INDEX `sessions_userId` (`userId`),
  INDEX `sessions_expires` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
