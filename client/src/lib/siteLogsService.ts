import { supabase } from './supabase';
import type { SiteLog, InsertSiteLog, SiteLogTask, InsertSiteLogTask, SiteLogAttendee, InsertSiteLogAttendee, SiteLogFile, InsertSiteLogFile } from '@shared/schema';

export const siteLogsService = {
  // Site Logs
  async getSiteLogsByProject(projectId: number): Promise<SiteLog[]> {
    const { data, error } = await supabase
      .from('site_logs')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createSiteLog(siteLog: InsertSiteLog): Promise<SiteLog> {
    console.log('Creating site log with data:', siteLog);
    
    const { data, error } = await supabase
      .from('site_logs')
      .insert(siteLog)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating site log:', error);
      throw error;
    }
    
    console.log('Site log created successfully:', data);
    return data;
  },

  async updateSiteLog(id: number, siteLog: Partial<InsertSiteLog>): Promise<SiteLog> {
    const { data, error } = await supabase
      .from('site_logs')
      .update(siteLog)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSiteLog(id: number): Promise<void> {
    const { error } = await supabase
      .from('site_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Site Log Tasks
  async getSiteLogTasks(siteLogId: number): Promise<SiteLogTask[]> {
    const { data, error } = await supabase
      .from('site_log_tasks')
      .select(`
        *,
        task:tasks(*)
      `)
      .eq('site_log_id', siteLogId);

    if (error) throw error;
    return data || [];
  },

  async createSiteLogTask(siteLogTask: InsertSiteLogTask): Promise<SiteLogTask> {
    const { data, error } = await supabase
      .from('site_log_tasks')
      .insert(siteLogTask)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSiteLogTask(id: number): Promise<void> {
    const { error } = await supabase
      .from('site_log_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Site Log Attendees
  async getSiteLogAttendees(siteLogId: number): Promise<SiteLogAttendee[]> {
    const { data, error } = await supabase
      .from('site_log_attendees')
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq('site_log_id', siteLogId);

    if (error) throw error;
    return data || [];
  },

  async createSiteLogAttendee(siteLogAttendee: InsertSiteLogAttendee): Promise<SiteLogAttendee> {
    const { data, error } = await supabase
      .from('site_log_attendees')
      .insert(siteLogAttendee)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSiteLogAttendee(id: number): Promise<void> {
    const { error } = await supabase
      .from('site_log_attendees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Site Log Files
  async getSiteLogFiles(siteLogId: number): Promise<SiteLogFile[]> {
    const { data, error } = await supabase
      .from('site_log_files')
      .select('*')
      .eq('site_log_id', siteLogId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createSiteLogFile(siteLogFile: InsertSiteLogFile): Promise<SiteLogFile> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('site_log_files')
      .insert({
        ...siteLogFile,
        uploaded_by: user.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSiteLogFile(id: number): Promise<void> {
    const { error } = await supabase
      .from('site_log_files')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // File upload
  async uploadFile(file: File, siteLogId: number): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${siteLogId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('site-logs')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('site-logs')
      .getPublicUrl(fileName);

    return publicUrl;
  }
};