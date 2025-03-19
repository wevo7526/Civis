export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date';
  description: string;
  required: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'communications' | 'grants';
  variables: TemplateVariable[];
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'donor-thank-you',
    name: 'Donor Thank You',
    description: 'Send personalized thank you messages to new donors',
    category: 'communications',
    variables: [
      {
        name: 'donor_name',
        type: 'string',
        description: 'Name of the donor',
        required: true
      },
      {
        name: 'amount',
        type: 'number',
        description: 'Donation amount',
        required: true
      },
      {
        name: 'project_name',
        type: 'string',
        description: 'Name of the project funded',
        required: false
      }
    ],
  },
  {
    id: 'grant-deadline-reminder',
    name: 'Grant Deadline Reminder',
    description: 'Send reminders for upcoming grant deadlines',
    category: 'grants',
    variables: [
      {
        name: 'grant_name',
        type: 'string',
        description: 'Name of the grant',
        required: true
      },
      {
        name: 'deadline',
        type: 'date',
        description: 'Application deadline',
        required: true
      },
      {
        name: 'requirements',
        type: 'string',
        description: 'Key requirements',
        required: false
      }
    ],
  }
];

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return workflowTemplates.find(template => template.id === id);
}

export function getTemplatesByCategory(category: WorkflowTemplate['category']): WorkflowTemplate[] {
  return workflowTemplates.filter(template => template.category === category);
}

export function validateTemplateVariables(template: WorkflowTemplate, variables: Record<string, any>): boolean {
  return template.variables.every(variable => {
    if (variable.required && !variables[variable.name]) {
      return false;
    }
    if (variables[variable.name]) {
      switch (variable.type) {
        case 'number':
          return typeof variables[variable.name] === 'number';
        case 'date':
          return !isNaN(Date.parse(variables[variable.name]));
        case 'string':
          return typeof variables[variable.name] === 'string';
        default:
          return false;
      }
    }
    return true;
  });
} 