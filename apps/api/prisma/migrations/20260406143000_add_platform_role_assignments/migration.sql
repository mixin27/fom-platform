ALTER TABLE "roles"
ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'shop';

ALTER TABLE "permissions"
ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'shop';

CREATE INDEX "roles_scope_idx" ON "roles"("scope");

CREATE INDEX "permissions_scope_idx" ON "permissions"("scope");

CREATE TABLE "user_role_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_role_assignments_userId_roleId_key" ON "user_role_assignments"("userId", "roleId");

CREATE INDEX "user_role_assignments_roleId_idx" ON "user_role_assignments"("roleId");

ALTER TABLE "user_role_assignments"
ADD CONSTRAINT "user_role_assignments_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_role_assignments"
ADD CONSTRAINT "user_role_assignments_roleId_fkey"
FOREIGN KEY ("roleId") REFERENCES "roles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
