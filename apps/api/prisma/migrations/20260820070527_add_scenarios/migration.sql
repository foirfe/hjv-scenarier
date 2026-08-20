-- CreateEnum
CREATE TYPE "ScenarioStatus" AS ENUM ('DRAFT', 'READY', 'ARCHIVED');

-- CreateTable
CREATE TABLE "scenarios" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ScenarioStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_tasks" (
    "id" UUID NOT NULL,
    "scenario_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "radius_meters" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenario_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_task_dependencies" (
    "scenario_task_id" UUID NOT NULL,
    "prerequisite_task_id" UUID NOT NULL,

    CONSTRAINT "scenario_task_dependencies_pkey" PRIMARY KEY ("scenario_task_id","prerequisite_task_id")
);

-- AddForeignKey
ALTER TABLE "scenario_tasks" ADD CONSTRAINT "scenario_tasks_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_tasks" ADD CONSTRAINT "scenario_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_task_dependencies" ADD CONSTRAINT "scenario_task_dependencies_scenario_task_id_fkey" FOREIGN KEY ("scenario_task_id") REFERENCES "scenario_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_task_dependencies" ADD CONSTRAINT "scenario_task_dependencies_prerequisite_task_id_fkey" FOREIGN KEY ("prerequisite_task_id") REFERENCES "scenario_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
