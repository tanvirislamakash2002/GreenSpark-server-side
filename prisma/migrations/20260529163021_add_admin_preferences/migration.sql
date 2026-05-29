-- CreateTable
CREATE TABLE "admin_preferences" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "newIdeaSubmissions" BOOLEAN NOT NULL DEFAULT true,
    "pendingReviewReminders" BOOLEAN NOT NULL DEFAULT true,
    "reportedContent" BOOLEAN NOT NULL DEFAULT true,
    "weeklySummary" BOOLEAN NOT NULL DEFAULT false,
    "systemAnnouncements" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_preferences_adminId_key" ON "admin_preferences"("adminId");

-- AddForeignKey
ALTER TABLE "admin_preferences" ADD CONSTRAINT "admin_preferences_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
