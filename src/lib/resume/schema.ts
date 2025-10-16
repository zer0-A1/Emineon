import { z } from 'zod';

// Canonical resume schema used by the Content Generator (standalone from competence files)
export const ResumeSchema = z.object({
  basics: z.object({
    name: z.string().default(''),
    title: z.string().default(''),
    location: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    links: z.array(z.string()).optional(),
    summary: z.string().optional(),
  }),
  skills: z.array(
    z.object({
      category: z.string(),
      items: z.array(z.string()).default([]),
    })
  ).default([]),
  experience: z.array(
    z.object({
      id: z.string(),
      role: z.string().default(''),
      company: z.string().default(''),
      period: z.string().default(''),
      location: z.string().optional(),
      bullets: z.array(z.string()).default([]),
      tech: z.array(z.string()).optional(),
    })
  ).default([]),
  projects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      summary: z.string().optional(),
      bullets: z.array(z.string()).optional(),
      tech: z.array(z.string()).optional(),
    })
  ).optional(),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string().optional(),
      period: z.string().optional(),
      details: z.array(z.string()).optional(),
    })
  ).optional(),
  extras: z.record(z.array(z.string())).optional(),
});

export type Resume = z.infer<typeof ResumeSchema>;


