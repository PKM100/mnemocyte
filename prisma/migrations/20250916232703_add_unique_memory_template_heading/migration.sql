/*
  Warnings:

  - A unique constraint covering the columns `[heading]` on the table `memory_templates` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "memory_templates_heading_key" ON "memory_templates"("heading");
