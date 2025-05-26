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
  createOrganization(org: InsertOrganization & { ownerId: number }): Promise<Organization>;
  
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
      ...insertUser, 
      id,
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

  async createOrganization(orgData: InsertOrganization & { ownerId: number }): Promise<Organization> {
    const id = this.currentOrgId++;
    const organization: Organization = {
      ...orgData,
      id,
      createdAt: new Date()
    };
    this.organizations.set(id, organization);
    return organization;
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
      ...projectData,
      id,
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
