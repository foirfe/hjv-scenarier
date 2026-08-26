-- CreateEnum
CREATE TYPE "TaskProgressStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "scenario_run_task_progress" (
    "scenario_run_task_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "TaskProgressStatus" NOT NULL DEFAULT 'LOCKED',
    "available_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenario_run_task_progress_pkey" PRIMARY KEY ("scenario_run_task_id","user_id")
);

-- AddForeignKey
ALTER TABLE "scenario_run_task_progress" ADD CONSTRAINT "scenario_run_task_progress_scenario_run_task_id_fkey" FOREIGN KEY ("scenario_run_task_id") REFERENCES "scenario_run_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_run_task_progress" ADD CONSTRAINT "scenario_run_task_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
