-- CreateEnum
CREATE TYPE "ScenarioRole" AS ENUM ('PARTICIPANT', 'TEAM_LEADER', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "ScenarioRunStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABORTED');

-- CreateTable
CREATE TABLE "scenario_runs" (
    "id" UUID NOT NULL,
    "scenario_id" UUID NOT NULL,
    "status" "ScenarioRunStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenario_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_run_users" (
    "scenario_run_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "ScenarioRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_run_users_pkey" PRIMARY KEY ("scenario_run_id","user_id")
);

-- AddForeignKey
ALTER TABLE "scenario_runs" ADD CONSTRAINT "scenario_runs_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_run_users" ADD CONSTRAINT "scenario_run_users_scenario_run_id_fkey" FOREIGN KEY ("scenario_run_id") REFERENCES "scenario_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_run_users" ADD CONSTRAINT "scenario_run_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
