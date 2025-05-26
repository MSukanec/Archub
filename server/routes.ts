import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertUserSchema, insertOrganizationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Users routes

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating user" });
      }
    }
  });

  // Organizations routes
  app.get("/api/organization", async (req, res) => {
    try {
      // For now, return a mock organization
      const organization = {
        id: 1,
        name: "Constructora ABC",
        description: "Empresa dedicada a la construcción y gestión de proyectos inmobiliarios.",
        ownerId: 1,
        createdAt: new Date().toISOString(),
      };
      res.json(organization);
    } catch (error) {
      res.status(500).json({ message: "Error fetching organization" });
    }
  });

  // Projects routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Error fetching projects" });
    }
  });

  app.get("/api/projects/overview", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      const overview = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        totalBudget: projects.reduce((sum, p) => sum + (parseFloat(p.budget || '0')), 0),
        averageProgress: projects.length > 0 
          ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length 
          : 0,
      };
      res.json(overview);
    } catch (error) {
      res.status(500).json({ message: "Error fetching projects overview" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...projectData,
        organizationId: 1, // Default organization for now
        createdBy: 1, // Default user for now
      });
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid project data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating project" });
      }
    }
  });

  // Admin Organizations Routes
  app.get('/api/admin/organizations', async (req, res) => {
    try {
      const organizations = await storage.getAllOrganizations();
      
      // Enrich with additional data
      const enrichedOrgs = await Promise.all(
        organizations.map(async (org) => {
          const projects = await storage.getProjectsByOrganization(org.id);
          const users = await storage.getAllUsers();
          const owner = users.find(u => u.id === org.ownerId);
          const members = users.filter(u => u.organizationId === org.id);
          
          return {
            ...org,
            projectCount: projects.length,
            memberCount: members.length,
            ownerName: owner ? `${owner.firstName} ${owner.lastName}` : null
          };
        })
      );
      
      res.json(enrichedOrgs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/organizations', async (req, res) => {
    try {
      const data = insertOrganizationSchema.parse(req.body);
      // For now, assign to first user as owner (should be current user in real app)
      const users = await storage.getAllUsers();
      const ownerId = users[0]?.id || 1;
      
      const organization = await storage.createOrganization({ ...data, ownerId });
      res.json(organization);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid organization data', details: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.put('/api/admin/organizations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertOrganizationSchema.partial().parse(req.body);
      
      const organization = await storage.updateOrganization(id, data);
      res.json(organization);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid organization data', details: error.errors });
      } else if (error.message === 'Organization not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.delete('/api/admin/organizations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOrganization(id);
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === 'Organization not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Stats routes
  app.get("/api/stats", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      const stats = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        totalBudget: projects.reduce((sum, p) => sum + (parseFloat(p.budget || '0')), 0),
        completedTasks: 0, // Mock data
        averageDays: 0, // Mock data
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  // Activities routes
  app.get("/api/activities/recent", async (req, res) => {
    try {
      const activities = await storage.getRecentActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching activities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
