-- CreateEnum
CREATE TYPE "TaskEnvironment" AS ENUM ('LAND', 'SEA');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "environment" "TaskEnvironment" NOT NULL DEFAULT 'SEA',
    "status" "TaskStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
