import { 
  users, 
  organizations, 
  organizationMembers, 
  projects, 
  activities,
  type User, 
  type InsertUser,
  type Organization,
  type InsertOrganization,
  type Project,
  type InsertProject,
  type Activity
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Organizations
  getOrganization(id: number): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization & { ownerId: number }): Promise<Organization>;
  updateOrganization(id: number, org: Partial<InsertOrganization>): Promise<Organization>;
  deleteOrganization(id: number): Promise<void>;
  
  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  getProjectsByOrganization(organizationId: number): Promise<Project[]>;
  createProject(project: InsertProject & { organizationId: number; createdBy: number }): Promise<Project>;
  
  // Activities
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private organizations: Map<number, Organization>;
  private organizationMembers: Map<number, any>;
  private projects: Map<number, Project>;
  private activities: Map<number, Activity>;
  private currentUserId: number;
  private currentOrgId: number;
  private currentProjectId: number;
  private currentActivityId: number;

  constructor() {
    this.users = new Map();
    this.organizations = new Map();
    this.organizationMembers = new Map();
    this.projects = new Map();
    this.activities = new Map();
    this.currentUserId = 1;
    this.currentOrgId = 1;
    this.currentProjectId = 1;
    this.currentActivityId = 1;
    
    // Create initial admin user
    this.initializeAdminUser();
  }

  private initializeAdminUser() {
    const adminUser: User = {
      id: this.currentUserId++,
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      createdAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id,
      email: insertUser.email,
      password: insertUser.password,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      role: 'user',
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Organizations
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async createOrganization(orgData: InsertOrganization & { ownerId: number }): Promise<Organization> {
    const id = this.currentOrgId++;
    const organization: Organization = {
      id,
      name: orgData.name,
      description: orgData.description || null,
      ownerId: orgData.ownerId,
      createdAt: new Date(),
    };
    this.organizations.set(id, organization);
    return organization;
  }

  async updateOrganization(id: number, orgData: Partial<InsertOrganization>): Promise<Organization> {
    const existing = this.organizations.get(id);
    if (!existing) {
      throw new Error('Organization not found');
    }
    
    const updated: Organization = {
      ...existing,
      ...orgData,
      description: orgData.description !== undefined ? orgData.description || null : existing.description,
    };
    this.organizations.set(id, updated);
    return updated;
  }

  async deleteOrganization(id: number): Promise<void> {
    if (!this.organizations.has(id)) {
      throw new Error('Organization not found');
    }
    this.organizations.delete(id);
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectsByOrganization(organizationId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      project => project.organizationId === organizationId
    );
  }

  async createProject(projectData: InsertProject & { organizationId: number; createdBy: number }): Promise<Project> {
    const id = this.currentProjectId++;
    const now = new Date();
    const project: Project = {
      id,
      name: projectData.name,
      description: projectData.description || null,
      location: projectData.location || null,
      budget: projectData.budget || null,
      startDate: projectData.startDate || null,
      endDate: projectData.endDate || null,
      organizationId: projectData.organizationId,
      createdBy: projectData.createdBy,
      status: 'planning',
      progress: 0,
      createdAt: now,
      updatedAt: now
    };
    this.projects.set(id, project);
    
    // Create activity for project creation
    await this.createActivity({
      type: 'project_created',
      title: 'Proyecto creado',
      description: `Se creó el proyecto "${project.name}"`,
      projectId: project.id,
      organizationId: project.organizationId,
      userId: project.createdBy
    });
    
    return project;
  }

  // Activities
  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    return activities;
  }

  async createActivity(activityData: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = {
      ...activityData,
      id,
      createdAt: new Date()
    };
    this.activities.set(id, activity);
    return activity;
  }
}

export const storage = new MemStorage();
