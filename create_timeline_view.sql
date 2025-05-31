-- Create a view that unifies all events by day for the timeline
CREATE OR REPLACE VIEW project_day_summary AS
SELECT 
  date,
  project_id,
  COUNT(DISTINCT site_logs.id) as bitacoras,
  COUNT(DISTINCT site_movements.id) as movimientos,
  COUNT(DISTINCT site_log_tasks.id) as tareas,
  COUNT(DISTINCT site_log_attendees.id) as asistentes,
  COUNT(DISTINCT site_log_files.id) as archivos
FROM 
  site_logs
  LEFT JOIN site_log_tasks ON site_logs.id = site_log_tasks.site_log_id
  LEFT JOIN site_log_attendees ON site_logs.id = site_log_attendees.site_log_id
  LEFT JOIN site_log_files ON site_logs.id = site_log_files.site_log_id
  LEFT JOIN site_movements ON site_logs.date = site_movements.date AND site_logs.project_id = site_movements.project_id
GROUP BY date, project_id;