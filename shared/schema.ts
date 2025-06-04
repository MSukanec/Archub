import { pgTable, text, serial, integer, boolean, timestamp, decimal, uuid, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // "FREE", "PRO", "ENTERPRISE"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  features: jsonb("features").notNull(), // Array of feature strings
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("user"), // admin, user
  planId: integer("plan_id").references(() => plans.id).default(1), // Default to FREE plan
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizationMembers = pgTable("organization_members", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("member"), // owner, admin, member
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("planning"), // planning, active, completed, cancelled
  progress: integer("progress").default(0), // 0-100
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id), // Link to contacts table
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // project_created, task_completed, budget_updated, etc.
  title: text("title").notNull(),
  description: text("description"),
  projectId: integer("project_id").references(() => projects.id),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const units = pgTable("units", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  first_name: varchar("first_name", { length: 255 }).notNull(),
  last_name: varchar("last_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  company_name: varchar("company_name", { length: 255 }),
  location: varchar("location", { length: 255 }),
  notes: text("notes"),
  contact_type: varchar("contact_type", { length: 100 }).notNull(), // proveedor, contratista, técnico, etc.
  organization_id: uuid("organization_id").notNull().references(() => organizations.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const contactTaskLinks = pgTable("contact_task_links", {
  id: serial("id").primaryKey(),
  contact_id: integer("contact_id").notNull().references(() => contacts.id),
  project_id: uuid("project_id").references(() => projects.id),
  task_description: text("task_description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const taskCategories = pgTable("task_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  parent_id: uuid("parent_id").references(() => taskCategories.id),
});

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit_id: integer("unit_id").notNull().references(() => units.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit_id: uuid("unit_id"),
  unit_labor_price: decimal("unit_labor_price", { precision: 12, scale: 2 }),
  unit_material_price: decimal("unit_material_price", { precision: 12, scale: 2 }),
  organization_id: uuid("organization_id"),
  category_id: uuid("category_id").references(() => taskCategories.id),
  subcategory_id: uuid("subcategory_id").references(() => taskCategories.id),
  element_category_id: uuid("element_category_id").references(() => taskCategories.id),
  action_id: uuid("action_id"),
  element_id: uuid("element_id"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Budgets table
export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  project_id: uuid("project_id").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Budget tasks table - junction table for budgets and tasks
export const budgetTasks = pgTable("budget_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  budget_id: uuid("budget_id").notNull().references(() => budgets.id, { onDelete: "cascade" }),
  task_id: integer("task_id").notNull().references(() => tasks.id),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Task materials table - junction table for tasks and materials
export const taskMaterials = pgTable("task_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  task_id: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  material_id: uuid("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  unit_cost: decimal("unit_cost", { precision: 12, scale: 2 }).default("0"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Site logs tables
export const siteLogs = pgTable("site_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").notNull(),
  author_id: uuid("author_id"), // Allow NULL to match database
  log_date: text("log_date").notNull(),
  weather: text("weather"),
  comments: text("comments"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const siteLogTasks = pgTable("site_log_tasks", {
  id: serial("id").primaryKey(),
  site_log_id: integer("site_log_id").references(() => siteLogs.id).notNull(),
  task_id: integer("task_id").references(() => tasks.id).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const siteLogAttendees = pgTable("site_log_attendees", {
  id: serial("id").primaryKey(),
  site_log_id: integer("site_log_id").references(() => siteLogs.id).notNull(),
  contact_id: integer("contact_id").references(() => contacts.id).notNull(),
  role: text("role"), // supervisor, worker, inspector, etc.
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const siteLogFiles = pgTable("site_log_files", {
  id: serial("id").primaryKey(),
  site_log_id: integer("site_log_id").references(() => siteLogs.id).notNull(),
  file_name: text("file_name").notNull(),
  file_url: text("file_url").notNull(),
  file_type: text("file_type").notNull(), // image, video, document
  file_size: integer("file_size"),
  description: text("description"),
  uploaded_by: integer("uploaded_by").references(() => users.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Site movements table for tracking financial movements
export const siteMovements = pgTable("site_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").notNull(),
  type: text("type").notNull(), // 'ingreso', 'egreso', 'ajuste'
  date: text("date").notNull(), // Store as ISO date string
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("ARS"),
  related_contact_id: uuid("related_contact_id"),
  related_task_id: integer("related_task_id").references(() => tasks.id),
  file_url: text("file_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  created_at_local: timestamp("created_at_local", { withTimezone: true }),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Calendar events table for agenda functionality
export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: text("date").notNull(), // Store as YYYY-MM-DD
  time: text("time").notNull(), // Store as HH:MM
  duration: varchar("duration", { length: 50 }).notNull(), // Duration in minutes
  location: varchar("location", { length: 255 }),
  attendees: text("attendees"), // Comma-separated list
  type: text("type").notNull().default("meeting"), // meeting, task, reminder, appointment
  priority: text("priority").notNull().default("medium"), // low, medium, high
  organization_id: uuid("organization_id").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  created_at_local: timestamp("created_at_local", { withTimezone: true }), // Local browser timestamp
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Wallets table for financial management
export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  wallet_type: text("wallet_type").notNull().default("bank"), // bank, cash, credit_card, investment, crypto
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Organization wallets table for linking wallets to organizations
export const organizationWallets = pgTable("organization_wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull(),
  wallet_id: uuid("wallet_id").notNull().references(() => wallets.id),
  is_default: boolean("is_default").notNull().default(false),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
  description: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  location: true,
  budget: true,
  startDate: true,
  endDate: true,
});

export const insertActionSchema = createInsertSchema(actions).pick({
  name: true,
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  first_name: true,
  last_name: true,
  email: true,
  phone: true,
  company_name: true,
  location: true,
  notes: true,
  contact_type: true,
});

export const insertTaskCategorySchema = createInsertSchema(taskCategories).pick({
  code: true,
  name: true,
  position: true,
  parent_id: true,
});

export const insertUnitSchema = createInsertSchema(units).pick({
  name: true,
  description: true,
});

export const insertMaterialSchema = createInsertSchema(materials).pick({
  name: true,
  unit_id: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  name: true,
  unit_id: true,
  unit_labor_price: true,
  unit_material_price: true,
  category_id: true,
  subcategory_id: true,
  element_category_id: true,
  action_id: true,
  element_id: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).pick({
  name: true,
  description: true,
  project_id: true,
});

export const insertBudgetTaskSchema = createInsertSchema(budgetTasks).pick({
  budget_id: true,
  task_id: true,
  quantity: true,
});

export const insertTaskMaterialSchema = createInsertSchema(taskMaterials).pick({
  task_id: true,
  material_id: true,
  quantity: true,
  unit_cost: true,
});

export const insertSiteLogSchema = createInsertSchema(siteLogs).pick({
  project_id: true,
  date: true,
  comments: true,
  weather: true,
});

export const insertSiteLogTaskSchema = createInsertSchema(siteLogTasks).pick({
  site_log_id: true,
  task_id: true,
  quantity: true,
  notes: true,
});

export const insertSiteLogAttendeeSchema = createInsertSchema(siteLogAttendees).pick({
  site_log_id: true,
  contact_id: true,
  role: true,
});

export const insertSiteLogFileSchema = createInsertSchema(siteLogFiles).pick({
  site_log_id: true,
  file_name: true,
  file_url: true,
  file_type: true,
  file_size: true,
  description: true,
});

export const insertSiteMovementSchema = createInsertSchema(siteMovements).pick({
  project_id: true,
  concept_id: true,
  created_at: true,
  description: true,
  amount: true,
  currency: true,
  related_contact_id: true,
  related_task_id: true,
  file_url: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).pick({
  title: true,
  description: true,
  date: true,
  time: true,
  duration: true,
  location: true,
  attendees: true,
  type: true,
  priority: true,
  organization_id: true,
  created_at_local: true,
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  name: true,
  description: true,
  wallet_type: true,
  is_active: true,
});

export const insertOrganizationWalletSchema = createInsertSchema(organizationWallets).pick({
  organization_id: true,
  wallet_id: true,
  is_default: true,
  is_active: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type OrganizationMember = typeof organizationMembers.$inferSelect;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Activity = typeof activities.$inferSelect;

export type Action = typeof actions.$inferSelect;
export type InsertAction = z.infer<typeof insertActionSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type ContactTaskLink = typeof contactTaskLinks.$inferSelect;

export type TaskCategory = typeof taskCategories.$inferSelect;
export type InsertTaskCategory = z.infer<typeof insertTaskCategorySchema>;

export type Unit = typeof units.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type SiteLog = typeof siteLogs.$inferSelect;
export type InsertSiteLog = z.infer<typeof insertSiteLogSchema>;

export type SiteLogTask = typeof siteLogTasks.$inferSelect;
export type InsertSiteLogTask = z.infer<typeof insertSiteLogTaskSchema>;

export type SiteLogAttendee = typeof siteLogAttendees.$inferSelect;
export type InsertSiteLogAttendee = z.infer<typeof insertSiteLogAttendeeSchema>;

export type SiteLogFile = typeof siteLogFiles.$inferSelect;
export type InsertSiteLogFile = z.infer<typeof insertSiteLogFileSchema>;

export type SiteMovement = typeof siteMovements.$inferSelect;
export type InsertSiteMovement = z.infer<typeof insertSiteMovementSchema>;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;

export type OrganizationWallet = typeof organizationWallets.$inferSelect;
export type InsertOrganizationWallet = z.infer<typeof insertOrganizationWalletSchema>;
