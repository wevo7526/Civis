import { Donor } from './donorService';
import { Grant, Volunteer, Event, Program, CommunityStakeholder, FundraisingCampaign } from './types';

export const aiService = {
  async generateOutreachMessage(donor: Donor): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateOutreachMessage',
          data: donor,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate outreach message');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error generating outreach message:', error);
      throw new Error('Failed to generate outreach message');
    }
  },

  async analyzeDonorEngagement(donor: Donor): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyzeDonorEngagement',
          data: donor,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze donor engagement');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error analyzing donor engagement:', error);
      throw new Error('Failed to analyze donor engagement');
    }
  },

  async generateDonorReport(donors: Donor[]): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateDonorReport',
          data: donors,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate donor report');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error generating donor report:', error);
      throw new Error('Failed to generate donor report');
    }
  },

  async generateGrantProposal(data: {
    projectName: string;
    projectDescription: string;
    targetAmount: number;
  }): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateGrantProposal',
          data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate grant proposal');
      }

      const result = await response.json();
      return result.proposal;
    } catch (error) {
      console.error('Error generating grant proposal:', error);
      throw new Error('Failed to generate grant proposal');
    }
  },

  async matchVolunteers(volunteers: Volunteer[], opportunities: string[]): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'matchVolunteers',
          data: { volunteers, opportunities },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to match volunteers');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error matching volunteers:', error);
      throw new Error('Failed to match volunteers');
    }
  },

  async optimizeEventPlan(event: Event): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'optimizeEventPlan',
          data: event,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize event plan');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error optimizing event plan:', error);
      throw new Error('Failed to optimize event plan');
    }
  },

  async assessProgramImpact(program: Program): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'assessProgramImpact',
          data: program,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assess program impact');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error assessing program impact:', error);
      throw new Error('Failed to assess program impact');
    }
  },

  async analyzeCommunityEngagement(stakeholders: CommunityStakeholder[]): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyzeCommunityEngagement',
          data: stakeholders,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze community engagement');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error analyzing community engagement:', error);
      throw new Error('Failed to analyze community engagement');
    }
  },

  async generateFundraisingStrategy(data: {
    organizationName: string;
    organizationType: string;
    targetAmount: number;
    timeframe: string;
    currentDonors: number;
  }): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateFundraisingStrategy',
          data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate fundraising strategy');
      }

      const result = await response.json();
      return result.strategy;
    } catch (error) {
      console.error('Error generating fundraising strategy:', error);
      throw new Error('Failed to generate fundraising strategy');
    }
  }
}; 