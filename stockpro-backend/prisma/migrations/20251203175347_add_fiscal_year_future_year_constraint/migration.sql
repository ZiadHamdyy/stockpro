-- Delete any existing fiscal years with future years before adding the constraint
-- These shouldn't exist based on our business logic, so we'll remove them
DELETE FROM "FiscalYear" WHERE EXTRACT(YEAR FROM "startDate") > EXTRACT(YEAR FROM CURRENT_DATE);

-- Add CHECK constraint to prevent fiscal years with startDate year greater than current year
-- This constraint ensures that fiscal periods cannot be created for future years
ALTER TABLE "FiscalYear" 
ADD CONSTRAINT "FiscalYear_startDate_year_not_future" 
CHECK (EXTRACT(YEAR FROM "startDate") <= EXTRACT(YEAR FROM CURRENT_DATE));

