-- CreateTable
CREATE TABLE "job-applications" (
    "applicationId" SERIAL NOT NULL,
    "applicantId" TEXT NOT NULL,
    "jobRoleId" INTEGER NOT NULL,
    "cvData" BYTEA NOT NULL,
    "cvFileName" TEXT NOT NULL,
    "cvMimeType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job-applications_pkey" PRIMARY KEY ("applicationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "job-applications_applicantId_jobRoleId_key" ON "job-applications"("applicantId", "jobRoleId");

-- AddForeignKey
ALTER TABLE "job-applications" ADD CONSTRAINT "job-applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job-applications" ADD CONSTRAINT "job-applications_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "job-roles"("jobRoleId") ON DELETE RESTRICT ON UPDATE CASCADE;
