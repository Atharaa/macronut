-- CreateTable
CREATE TABLE "ManualDayIntake" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "kcal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ManualDayIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManualDayIntake_userId_date_key" ON "ManualDayIntake"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReview_userId_weekStart_key" ON "WeeklyReview"("userId", "weekStart");

-- AddForeignKey
ALTER TABLE "ManualDayIntake" ADD CONSTRAINT "ManualDayIntake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReview" ADD CONSTRAINT "WeeklyReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

