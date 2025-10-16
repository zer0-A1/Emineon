// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { searchCache, CacheStrategies } from '../cache/redis-client';
import { performanceMonitor } from '../monitoring/performance';

// Database queries handled through db import

export interface SearchFilters {
  status?: string[];
  skills?: string[];
  location?: string;
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  availability?: string[];
  languages?: string[];
  contractType?: string[];
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class SearchService {
  // Enhanced candidate search with caching
  static async searchCandidates(
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ) {
    const { page = 1, limit = 20, sortBy = 'lastUpdated', sortOrder = 'desc' } = options;
    
    // Generate cache key
    const cacheKey = CacheStrategies.candidateSearch.keyGenerator(query, { filters, options });
    
    // Try cache first
    const cached = await searchCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Measure performance
    return await performanceMonitor.measureAsync('search:candidates', async () => {
      const offset = (page - 1) * limit;
      
      // Build where clause
      const where: any = {};
      
      // Full-text search
      if (query) {
        where.OR = [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { currentTitle: { contains: query, mode: 'insensitive' } },
          { currentLocation: { contains: query, mode: 'insensitive' } },
          { professionalHeadline: { contains: query, mode: 'insensitive' } },
          { technicalSkills: { hasSome: query.split(' ') } },
        ];
      }
      
      // Apply filters
      if (filters.status?.length) {
        where.status = { in: filters.status };
      }
      
      if (filters.skills?.length) {
        where.technicalSkills = { hasSome: filters.skills };
      }
      
      if (filters.location) {
        where.currentLocation = { contains: filters.location, mode: 'insensitive' };
      }
      
      if (filters.experienceMin !== undefined || filters.experienceMax !== undefined) {
        where.experienceYears = {};
        if (filters.experienceMin !== undefined) {
          where.experienceYears.gte = filters.experienceMin;
        }
        if (filters.experienceMax !== undefined) {
          where.experienceYears.lte = filters.experienceMax;
        }
      }
      
      if (filters.languages?.length) {
        where.spokenLanguages = { hasSome: filters.languages };
      }
      
      if (filters.contractType?.length) {
        where.preferredContractType = { in: filters.contractType };
      }
      
      // Execute search with count
      const [candidates, total] = await Promise.all([
        db.candidate.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            currentLocation: true,
            currentTitle: true,
            experienceYears: true,
            technicalSkills: true,
            expectedSalary: true,
            status: true,
            lastUpdated: true,
            profileToken: true,
            // Include match score if searching
            ...(query ? {
              applications: {
                select: {
                  job: {
                    select: {
                      title: true,
                      requiredSkills: true,
                    }
                  }
                }
              }
            } : {})
          }
        }),
        db.candidate.count({ where })
      ]);
      
      // Calculate relevance scores if searching
      const resultsWithScores = query ? candidates.map(candidate => {
        let score = 0;
        
        // Name match (highest weight)
        const fullName = `${candidate.firstName} ${candidate.lastName}`.toLowerCase();
        if (fullName.includes(query.toLowerCase())) score += 10;
        
        // Email match
        if (candidate.email.toLowerCase().includes(query.toLowerCase())) score += 8;
        
        // Title match
        if (candidate.currentTitle?.toLowerCase().includes(query.toLowerCase())) score += 7;
        
        // Skills match
        const queryTerms = query.toLowerCase().split(' ');
        candidate.technicalSkills?.forEach(skill => {
          if (queryTerms.some(term => skill.toLowerCase().includes(term))) score += 5;
        });
        
        // Location match
        if (candidate.currentLocation?.toLowerCase().includes(query.toLowerCase())) score += 3;
        
        return { ...candidate, relevanceScore: score };
      }).sort((a, b) => b.relevanceScore - a.relevanceScore) : candidates;
      
      const result = {
        candidates: resultsWithScores,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
      
      // Cache the result
      await searchCache.set(cacheKey, result, CacheStrategies.candidateSearch.ttl);
      
      return result;
    });
  }
  
  // Search jobs with optimization
  static async searchJobs(
    query: string,
    filters: any = {},
    options: SearchOptions = {}
  ) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;
    
    return await performanceMonitor.measureAsync('search:jobs', async () => {
      // Build where clause
      const where: any = { archived: false };
      
      if (query) {
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { requiredSkills: { hasSome: query.split(' ') } },
        ];
      }
      
      // Apply filters
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.clientId) {
        where.clientId = filters.clientId;
      }
      
      if (filters.projectId) {
        where.projectId = filters.projectId;
      }
      
      if (filters.location) {
        where.location = { contains: filters.location, mode: 'insensitive' };
      }
      
      if (filters.employmentType?.length) {
        where.employmentType = { hasSome: filters.employmentType };
      }
      
      // Execute search
      const [jobs, total] = await Promise.all([
        db.job.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            project: {
              select: {
                name: true,
                client: {
                  select: { name: true }
                }
              }
            },
            _count: {
              select: { applications: true }
            }
          }
        }),
        db.job.count({ where })
      ]);
      
      return {
        jobs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    });
  }
  
  // Get search suggestions
  static async getSearchSuggestions(
    type: 'candidates' | 'jobs',
    query: string
  ): Promise<string[]> {
    if (!query || query.length < 2) return [];
    
    if (type === 'candidates') {
      // Get skill suggestions
      const skills = await db.candidate.findMany({
        where: {
          technicalSkills: {
            hasSome: [query]
          }
        },
        select: {
          technicalSkills: true
        },
        take: 100
      });
      
      // Aggregate and count skills
      const skillCounts = new Map<string, number>();
      skills.forEach(candidate => {
        candidate.technicalSkills?.forEach(skill => {
          if (skill.toLowerCase().includes(query.toLowerCase())) {
            skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
          }
        });
      });
      
      // Sort by frequency and return top suggestions
      return Array.from(skillCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill]) => skill);
    } else {
      // Get job title suggestions
      const jobs = await db.job.findMany({
        where: {
          title: {
            contains: query,
            mode: 'insensitive'
          }
        },
        select: {
          title: true
        },
        distinct: ['title'],
        take: 10
      });
      
      return jobs.map(job => job.title);
    }
  }
  
  // Advanced search with AI-powered matching
  static async smartSearch(
    query: string,
    context: 'job_matching' | 'candidate_discovery'
  ) {
    // This would integrate with AI services for semantic search
    // For now, use enhanced keyword search
    
    if (context === 'job_matching') {
      // Find candidates that match a job description
      const keywords = this.extractKeywords(query);
      
      return await this.searchCandidates(
        keywords.join(' '),
        {
          skills: keywords.filter(k => k.length > 3),
        },
        { limit: 50 }
      );
    } else {
      // Find jobs that match a candidate profile
      const keywords = this.extractKeywords(query);
      
      return await this.searchJobs(
        keywords.join(' '),
        {},
        { limit: 50 }
      );
    }
  }
  
  // Extract keywords from text
  private static extractKeywords(text: string): string[] {
    // Remove common words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]);
    
    // Extract words and filter
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter((word, index, self) => self.indexOf(word) === index); // unique
  }
  
  // Invalidate search caches
  static async invalidateSearchCache(type: 'candidates' | 'jobs') {
    if (type === 'candidates') {
      await searchCache.deletePattern('search:candidates:*');
    } else {
      await searchCache.deletePattern('search:jobs:*');
    }
  }
}
