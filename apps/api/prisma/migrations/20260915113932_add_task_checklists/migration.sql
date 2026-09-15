-- AlterTable
ALTER TABLE "scenario_run_task_progress" ADD COLUMN     "checked_checklist_item_ids" JSONB;

-- CreateTable
CREATE TABLE "task_checklist_items" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "item_text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "task_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_run_task_checklist_items" (
    "id" UUID NOT NULL,
    "scenario_run_task_id" UUID NOT NULL,
    "source_checklist_item_id" UUID NOT NULL,
    "item_text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "scenario_run_task_checklist_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "task_checklist_items" ADD CONSTRAINT "task_checklist_items_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_run_task_checklist_items" ADD CONSTRAINT "scenario_run_task_checklist_items_scenario_run_task_id_fkey" FOREIGN KEY ("scenario_run_task_id") REFERENCES "scenario_run_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
