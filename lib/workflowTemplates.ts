export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'notification' | 'task';
  trigger: 'donation' | 'anniversary' | 'scheduled' | 'manual';
  template: string;
  variables: string[];
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'thank-you-donation',
    name: 'Thank You for Donation',
    description: 'Send a thank you email after receiving a donation',
    type: 'email',
    trigger: 'donation',
    template: `Dear {{donor_name}},

Thank you for your generous donation of {{amount}}. Your support means a lot to us and will help us continue our mission.

Best regards,
{{organization_name}}`,
    variables: ['donor_name', 'amount', 'organization_name']
  },
  {
    id: 'donation-anniversary',
    name: 'Donation Anniversary',
    description: 'Send an anniversary email to donors',
    type: 'email',
    trigger: 'anniversary',
    template: `Dear {{donor_name}},

One year ago, your generous support helped us make a difference. We wanted to take a moment to share the impact of your contribution.

Thank you for being part of our journey.

Best regards,
{{organization_name}}`,
    variables: ['donor_name', 'organization_name']
  },
  {
    id: 'monthly-newsletter',
    name: 'Monthly Newsletter',
    description: 'Send monthly updates to donors',
    type: 'email',
    trigger: 'scheduled',
    template: `Dear {{donor_name}},

Here's your monthly update on the impact of your support:

{{impact_summary}}

Thank you for your continued support.

Best regards,
{{organization_name}}`,
    variables: ['donor_name', 'impact_summary', 'organization_name']
  },
  {
    id: 'donation-reminder',
    name: 'Donation Reminder',
    description: 'Send a gentle reminder for recurring donations',
    type: 'email',
    trigger: 'scheduled',
    template: `Dear {{donor_name}},

This is a friendly reminder about your upcoming scheduled donation. Your continued support helps us make a difference.

Best regards,
{{organization_name}}`,
    variables: ['donor_name', 'organization_name']
  }
]; 