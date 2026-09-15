-- AlterTable
ALTER TABLE "scenario_run_task_progress" ADD COLUMN     "answer_correct" BOOLEAN,
ADD COLUMN     "answer_text" TEXT,
ADD COLUMN     "answered_at" TIMESTAMP(3),
ADD COLUMN     "selected_option_ids" JSONB;
