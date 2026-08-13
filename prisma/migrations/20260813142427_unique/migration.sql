/*
  Warnings:

  - A unique constraint covering the columns `[bandName]` on the table `band` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[capabilityName]` on the table `capability` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[statusName]` on the table `status` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "band_bandName_key" ON "band"("bandName");

-- CreateIndex
CREATE UNIQUE INDEX "capability_capabilityName_key" ON "capability"("capabilityName");

-- CreateIndex
CREATE UNIQUE INDEX "status_statusName_key" ON "status"("statusName");
