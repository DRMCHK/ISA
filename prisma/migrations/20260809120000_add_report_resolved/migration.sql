-- Add the column present in the Prisma schema but absent from the initial migration.
ALTER TABLE "Report" ADD COLUMN "resolved" BOOLEAN NOT NULL DEFAULT false;
