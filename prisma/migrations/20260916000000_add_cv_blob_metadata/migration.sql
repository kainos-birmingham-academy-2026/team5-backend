ALTER TABLE "job-applications"
ADD COLUMN "cvBlobName" TEXT,
ADD COLUMN "cvScanStatus" TEXT NOT NULL DEFAULT 'pending';