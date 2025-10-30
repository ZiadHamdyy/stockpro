-- Create enum and add type column to Item
CREATE TYPE "ItemType" AS ENUM ('STOCKED', 'SERVICE');

ALTER TABLE "Item"
ADD COLUMN "type" "ItemType" NOT NULL DEFAULT 'STOCKED';


