import { NextResponse } from 'next/server';
import { ChatAnthropic } from '@langchain/anthropic';
import { Donor } from '@/app/lib/donorService';

const model = new ChatAnthropic({
  modelName: 'claude-3-sonnet-20240229',
  temperature: 0.7,
  maxTokens: 1000,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'analyzeDonorEngagement': {
        const donors = data as Donor[];
        if (!donors || donors.length === 0) {
          return NextResponse.json({ 
            content: "I don't see any donor data to analyze. Please add some donor information to get started." 
          });
        }

        const totalDonors = donors.length;
        const highEngagement = donors.filter(d => d.engagement === 'high').length;
        const mediumEngagement = donors.filter(d => d.engagement === 'medium').length;
        const lowEngagement = donors.filter(d => d.engagement === 'low').length;
        
        const totalAmount = donors.reduce((sum, d) => sum + d.amount, 0);
        const averageAmount = totalAmount / totalDonors;

        const response = await model.invoke([
          {
            role: 'user',
            content: `Analyze the following donor engagement data and provide insights:
              Total Donors: ${totalDonors}
              High Engagement: ${highEngagement} (${((highEngagement/totalDonors)*100).toFixed(1)}%)
              Medium Engagement: ${mediumEngagement} (${((mediumEngagement/totalDonors)*100).toFixed(1)}%)
              Low Engagement: ${lowEngagement} (${((lowEngagement/totalDonors)*100).toFixed(1)}%)
              Total Donations: $${totalAmount.toLocaleString()}
              Average Donation: $${averageAmount.toLocaleString()}
              
              Please provide:
              1. Key trends in donor engagement
              2. Areas for improvement
              3. Recommendations for increasing engagement
              4. Potential opportunities for growth`
          }
        ]);

        return NextResponse.json({ content: response.content.toString() });
      }

      case 'generateOutreachMessage': {
        const donor = data as Donor;
        const response = await model.invoke([
          {
            role: 'user',
            content: `Generate a personalized outreach message for a donor with the following details:
              Name: ${donor.name}
              Last Donation: ${donor.last_donation}
              Amount: $${donor.amount}
              Engagement Level: ${donor.engagement}
              
              The message should be warm, personal, and focused on their impact.`
          }
        ]);

        return NextResponse.json({ content: response.content.toString() });
      }

      case 'generateDonorReport': {
        const donors = data as Donor[];
        if (!donors || donors.length === 0) {
          return NextResponse.json({ 
            content: "I don't see any donor data to generate a report. Please add some donor information to get started." 
          });
        }

        const response = await model.invoke([
          {
            role: 'user',
            content: `Generate a comprehensive donor report based on the following data:
              Number of Donors: ${donors.length}
              Total Revenue: $${donors.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
              Average Donation: $${(donors.reduce((sum, d) => sum + d.amount, 0) / donors.length).toLocaleString()}
              
              Please include:
              1. Overall fundraising performance
              2. Donor demographics and segments
              3. Engagement patterns
              4. Growth opportunities
              5. Strategic recommendations`
          }
        ]);

        return NextResponse.json({ content: response.content.toString() });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in AI API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 