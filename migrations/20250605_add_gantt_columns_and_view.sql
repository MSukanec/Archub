-- Add Gantt-related columns to budget_tasks table
ALTER TABLE budget_tasks 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS planned_days INTEGER,
ADD COLUMN IF NOT EXISTS priority SMALLINT DEFAULT 1,
ADD COLUMN IF NOT EXISTS dependencies UUID[];

-- Create trigger function to automatically calculate planned_days
CREATE OR REPLACE FUNCTION calculate_planned_days()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
        NEW.planned_days = NEW.end_date - NEW.start_date + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate planned_days on insert/update
DROP TRIGGER IF EXISTS trigger_calculate_planned_days ON budget_tasks;
CREATE TRIGGER trigger_calculate_planned_days
    BEFORE INSERT OR UPDATE ON budget_tasks
    FOR EACH ROW
    EXECUTE FUNCTION calculate_planned_days();

-- Create gantt_tasks_view that consolidates all Gantt information
CREATE OR REPLACE VIEW gantt_tasks_view AS
SELECT 
    bt.id,
    bt.task_id,
    t.name AS task_name,
    bt.start_date,
    bt.end_date,
    bt.planned_days,
    bt.priority,
    bt.dependencies,
    bt.budget_id,
    bt.quantity,
    bt.created_at,
    bt.updated_at,
    COALESCE(progress_data.total_progress, 0) AS progress_percentage,
    b.project_id
FROM budget_tasks bt
LEFT JOIN tasks t ON bt.task_id = t.id
LEFT JOIN budgets b ON bt.budget_id = b.id
LEFT JOIN (
    SELECT 
        slt.budget_task_id,
        SUM(slt.progress_percentage) AS total_progress
    FROM site_log_tasks slt
    GROUP BY slt.budget_task_id
) progress_data ON bt.id = progress_data.budget_task_id
ORDER BY bt.priority ASC, bt.start_date ASC NULLS LAST;

-- Create function to get Gantt tasks by project
CREATE OR REPLACE FUNCTION get_gantt_tasks_by_project(p_project_id UUID)
RETURNS TABLE (
    id UUID,
    task_id UUID,
    task_name TEXT,
    start_date DATE,
    end_date DATE,
    planned_days INTEGER,
    priority SMALLINT,
    dependencies UUID[],
    budget_id UUID,
    quantity INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    progress_percentage NUMERIC,
    project_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM gantt_tasks_view
    WHERE gantt_tasks_view.project_id = p_project_id;
END;
$$ LANGUAGE plpgsql;