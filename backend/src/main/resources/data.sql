INSERT INTO role (id, name, created_at, updated_at, is_deleted)
VALUES (UUID_TO_BIN(UUID(), 1), 'USER', NOW(), NOW(), false);

INSERT INTO role (id, name, created_at, updated_at, is_deleted)
VALUES (UUID_TO_BIN(UUID(), 1), 'ADMIN', NOW(), NOW(), false);