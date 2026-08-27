-- CreateEnum
CREATE TYPE "ActivationMode" AS ENUM ('GEO', 'AUTOMATIC', 'MANUAL');

-- AlterTable
ALTER TABLE "scenario_run_tasks" ADD COLUMN     "activation_mode" "ActivationMode" NOT NULL DEFAULT 'GEO',
ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL,
ALTER COLUMN "radius_meters" DROP NOT NULL;

-- AlterTable
ALTER TABLE "scenario_tasks" ADD COLUMN     "activation_mode" "ActivationMode" NOT NULL DEFAULT 'GEO',
ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL,
ALTER COLUMN "radius_meters" DROP NOT NULL;
