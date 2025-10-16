import { loggingService, LogEntry } from '../services/logging';

export interface WorkflowTrigger {
  event: string;
  data: any;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface WorkflowAction {
  type: 'assign_recruiter' | 'send_email' | 'update_status' | 'create_task';
  params: any;
}

// Mock workflow rules data
const mockWorkflowRules = [
  {
    id: '1',
    name: 'Auto-assign new applications',
    trigger: 'application_created',
    conditions: {
      'job.department': { operator: 'equals', value: 'Engineering' }
    },
    actions: {
      'assign_recruiter': { recruiterId: 'default_tech_recruiter' },
      'update_status': { status: 'REVIEWING' }
    },
    isActive: true
  },
  {
    id: '2',
    name: 'High-experience candidate alert',
    trigger: 'application_created',
    conditions: {
      'candidate.experience': { operator: 'greater_than', value: 10 }
    },
    actions: {
      'send_email': {
        template: 'senior_candidate_alert',
        recipient: 'hiring_manager@company.com'
      }
    },
    isActive: true
  }
];

export class WorkflowEngine {
  async executeWorkflows(trigger: WorkflowTrigger) {
    try {
      // Get active workflow rules for this trigger (mock implementation)
      const rules = mockWorkflowRules.filter(rule => 
        rule.trigger === trigger.event && rule.isActive
      );

      for (const rule of rules) {
        const conditions = rule.conditions as Record<string, any>;
        const actions = rule.actions as Record<string, any>;

        if (this.evaluateConditions(conditions, trigger.data)) {
          await this.executeActions(actions, trigger.data);
          
          await loggingService.log({
            actor: 'SYSTEM',
            action: 'workflow_executed',
            resource: `workflow_rule:${rule.id}`,
            details: {
              ruleName: rule.name,
              trigger: trigger.event,
              data: trigger.data
            }
          });
        }
      }
    } catch (error) {
      console.error('Workflow execution error:', error);
      await loggingService.log({
        actor: 'SYSTEM',
        action: 'workflow_error',
        resource: 'workflow_engine',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        level: 'ERROR'
      });
    }
  }

  private evaluateConditions(conditions: Record<string, any>, data: any): boolean {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // No conditions = always true
    }

    for (const [field, condition] of Object.entries(conditions)) {
      const fieldValue = this.getNestedValue(data, field);
      
      if (!this.evaluateCondition(fieldValue, condition)) {
        return false;
      }
    }
    
    return true;
  }

  private evaluateCondition(fieldValue: any, condition: any): boolean {
    const { operator, value } = condition;
    
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      default:
        return false;
    }
  }

  private async executeActions(actions: Record<string, any>, data: any) {
    for (const [actionType, actionParams] of Object.entries(actions)) {
      try {
        await this.executeAction(actionType, actionParams, data);
      } catch (error) {
        console.error(`Action execution error for ${actionType}:`, error);
      }
    }
  }

  private async executeAction(actionType: string, params: any, triggerData: any) {
    switch (actionType) {
      case 'assign_recruiter':
        await this.assignRecruiter(params, triggerData);
        break;
      case 'update_status':
        await this.updateStatus(params, triggerData);
        break;
      case 'send_email':
        await this.sendEmail(params, triggerData);
        break;
      case 'create_task':
        await this.createTask(params, triggerData);
        break;
      default:
        console.warn(`Unknown action type: ${actionType}`);
    }
  }

  private async assignRecruiter(params: any, data: any) {
    // Mock implementation - would integrate with actual assignment logic
    console.log('Assigning recruiter:', params.recruiterId, 'to', data.resourceId);
  }

  private async updateStatus(params: any, data: any) {
    // Mock implementation - would update application status in database
    console.log('Updating status:', params.status, 'for application:', data.applicationId);
  }

  private async sendEmail(params: any, data: any) {
    // Mock implementation - would integrate with email service
    console.log('Sending email:', params.template, 'to', params.recipient);
  }

  private async createTask(params: any, data: any) {
    // Mock implementation - would create task in task management system
    console.log('Creating task:', params.title, 'for', params.assignee);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Predefined workflow templates
  static getDefaultRules() {
    return mockWorkflowRules;
  }
}

export const workflowEngine = new WorkflowEngine();

export class WorkflowService {
  async triggerWorkflow(event: string, data: any) {
    console.log('Triggering workflow:', event, data);
    return { triggered: true, rulesExecuted: 1 };
  }
}

export const workflowService = new WorkflowService(); 