-- Add code column to Company table
ALTER TABLE "Company" ADD COLUMN "code" TEXT;

-- Generate unique 6-8 digit codes for existing companies
-- Using a function to generate random codes and ensure uniqueness
DO $$
DECLARE
  company_record RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
  min_code INT := 100000;
  max_code INT := 99999999;
BEGIN
  FOR company_record IN SELECT id FROM "Company" WHERE code IS NULL LOOP
    LOOP
      -- Generate random code between 6-8 digits (100000 to 99999999)
      new_code := LPAD(FLOOR(RANDOM() * (max_code - min_code + 1) + min_code)::TEXT, 
                       CASE 
                         WHEN RANDOM() < 0.5 THEN 6 
                         WHEN RANDOM() < 0.8 THEN 7 
                         ELSE 8 
                       END, '0');
      
      -- Check if code already exists
      SELECT EXISTS(SELECT 1 FROM "Company" WHERE code = new_code) INTO code_exists;
      
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    -- Update company with generated code
    UPDATE "Company" SET code = new_code WHERE id = company_record.id;
  END LOOP;
END $$;

-- Make code NOT NULL and add unique constraint
ALTER TABLE "Company" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");

-- Drop host column and its index
DROP INDEX IF EXISTS "Company_host_idx";
ALTER TABLE "Company" DROP COLUMN IF EXISTS "host";

