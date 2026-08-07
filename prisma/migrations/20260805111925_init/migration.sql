-- CreateTable
CREATE TABLE "job-roles" (
    "jobRoleId" SERIAL NOT NULL,
    "roleName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capabilityId" INTEGER NOT NULL,
    "bandId" INTEGER NOT NULL,
    "closingDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "job-roles_pkey" PRIMARY KEY ("jobRoleId")
);

-- CreateTable
CREATE TABLE "capability" (
    "capabilityId" SERIAL NOT NULL,
    "capabilityName" TEXT NOT NULL,

    CONSTRAINT "capability_pkey" PRIMARY KEY ("capabilityId")
);

-- CreateTable
CREATE TABLE "band" (
    "nameId" SERIAL NOT NULL,
    "bandName" TEXT NOT NULL,

    CONSTRAINT "band_pkey" PRIMARY KEY ("nameId")
);

-- AddForeignKey
ALTER TABLE "job-roles" ADD CONSTRAINT "job-roles_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capability"("capabilityId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job-roles" ADD CONSTRAINT "job-roles_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "band"("nameId") ON DELETE RESTRICT ON UPDATE CASCADE;
