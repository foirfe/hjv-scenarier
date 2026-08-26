-- CreateTable
CREATE TABLE "scenario_run_tasks" (
    "id" UUID NOT NULL,
    "scenario_run_id" UUID NOT NULL,
    "source_scenario_task_id" UUID NOT NULL,
    "source_task_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT NOT NULL,
    "answer_type" "AnswerType",
    "task_type_code" TEXT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "radius_meters" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_run_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_run_task_options" (
    "id" UUID NOT NULL,
    "scenario_run_task_id" UUID NOT NULL,
    "option_text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "scenario_run_task_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_run_task_dependencies" (
    "scenario_run_task_id" UUID NOT NULL,
    "prerequisite_run_task_id" UUID NOT NULL,

    CONSTRAINT "scenario_run_task_dependencies_pkey" PRIMARY KEY ("scenario_run_task_id","prerequisite_run_task_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scenario_run_tasks_scenario_run_id_source_scenario_task_id_key" ON "scenario_run_tasks"("scenario_run_id", "source_scenario_task_id");

-- AddForeignKey
ALTER TABLE "scenario_run_tasks" ADD CONSTRAINT "scenario_run_tasks_scenario_run_id_fkey" FOREIGN KEY ("scenario_run_id") REFERENCES "scenario_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_run_task_options" ADD CONSTRAINT "scenario_run_task_options_scenario_run_task_id_fkey" FOREIGN KEY ("scenario_run_task_id") REFERENCES "scenario_run_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_run_task_dependencies" ADD CONSTRAINT "scenario_run_task_dependencies_scenario_run_task_id_fkey" FOREIGN KEY ("scenario_run_task_id") REFERENCES "scenario_run_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_run_task_dependencies" ADD CONSTRAINT "scenario_run_task_dependencies_prerequisite_run_task_id_fkey" FOREIGN KEY ("prerequisite_run_task_id") REFERENCES "scenario_run_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
