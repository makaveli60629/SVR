/*
  Phase 370 — secure admin and test account role assignment

  Run only after both accounts have registered through /site/login.html.
  Replace the two placeholder email values before execution.
  This script does not create or store passwords.
*/

SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @AdminEmail NVARCHAR(255) = LOWER(N'REPLACE_WITH_ADMIN_EMAIL');
DECLARE @TestEmail  NVARCHAR(255) = LOWER(N'REPLACE_WITH_TEST_PLAYER_EMAIL');

IF @AdminEmail LIKE N'REPLACE_%' OR @TestEmail LIKE N'REPLACE_%'
BEGIN
  ROLLBACK TRANSACTION;
  THROW 51000, 'Replace the Phase 370 admin and test email placeholders before running this script.', 1;
END;

IF @AdminEmail = @TestEmail
BEGIN
  ROLLBACK TRANSACTION;
  THROW 51001, 'Admin and test player must use different email addresses.', 1;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Players WHERE LOWER(Email) = @AdminEmail AND IsActive = 1)
BEGIN
  ROLLBACK TRANSACTION;
  THROW 51002, 'The admin account must register before role assignment.', 1;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Players WHERE LOWER(Email) = @TestEmail AND IsActive = 1)
BEGIN
  ROLLBACK TRANSACTION;
  THROW 51003, 'The test player account must register before role assignment.', 1;
END;

UPDATE dbo.Players
SET Role = 'admin', UpdatedAt = SYSUTCDATETIME()
WHERE LOWER(Email) = @AdminEmail AND IsActive = 1;

UPDATE dbo.Players
SET Role = 'player', UpdatedAt = SYSUTCDATETIME()
WHERE LOWER(Email) = @TestEmail AND IsActive = 1;

COMMIT TRANSACTION;

SELECT PlayerId, DisplayName, Email, Role, IsActive, UpdatedAt
FROM dbo.Players
WHERE LOWER(Email) IN (@AdminEmail, @TestEmail)
ORDER BY CASE WHEN LOWER(Email) = @AdminEmail THEN 0 ELSE 1 END;
