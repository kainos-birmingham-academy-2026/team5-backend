-- AlterTable
ALTER TABLE "job-roles" ADD COLUMN     "description" TEXT,
ADD COLUMN     "numberOfOpenPositions" INTEGER,
ADD COLUMN     "responsibilities" TEXT,
ADD COLUMN     "sharepointUrl" TEXT,
ADD COLUMN     "statusId" INTEGER;

-- CreateTable
CREATE TABLE "status" (
    "statusId" SERIAL NOT NULL,
    "statusName" TEXT NOT NULL,

    CONSTRAINT "status_pkey" PRIMARY KEY ("statusId")
);

-- AddForeignKey
ALTER TABLE "job-roles" ADD CONSTRAINT "job-roles_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "status"("statusId") ON DELETE SET NULL ON UPDATE CASCADE;
