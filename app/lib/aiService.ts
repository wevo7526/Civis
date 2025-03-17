import { Donor } from './donorService';

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

  async analyzeDonorEngagement(donors: Donor[]): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyzeDonorEngagement',
          data: donors,
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
  }
}; 