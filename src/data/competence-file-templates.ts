import { StyleConfig } from './job-templates';

export interface CompetenceFileTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry?: string;
  colors?: string[];
  features?: string[];
  styleConfig: StyleConfig;
  sections: {
    key: string;
    label: string;
    show: boolean;
    order: number;
  }[];
  previewImage?: string;
}

// Static templates removed - templates are now managed dynamically through the database
export const competenceFileTemplates: CompetenceFileTemplate[] = [];

export default competenceFileTemplates; 