-- AlterTable
ALTER TABLE "ideas" ADD COLUMN     "voteScore" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "ideas_voteScore_idx" ON "ideas"("voteScore");
