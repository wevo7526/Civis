import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FundraisingStrategy, StrategyInsight, FundraisingMetric } from './types';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const strategyService = {
  async generateStrategy(strategyId: string) {
    const supabase = createClientComponentClient();
    
    // Fetch the strategy data
    const { data: strategy, error: strategyError } = await supabase
      .from('fundraising_strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (strategyError) throw strategyError;
    if (!strategy) throw new Error('Strategy not found');

    // Generate comprehensive strategy using AI
    const prompt = `Create a comprehensive fundraising strategy for the following organization:

Organization: ${strategy.organization_name}
Type: ${strategy.organization_type}
Target Amount: $${strategy.target_amount}
Timeframe: ${strategy.timeframe}
Current Donors: ${strategy.current_donors}

Mission:
${strategy.mission}

Previous Fundraising Experience:
${strategy.previous_fundraising}

Key Programs:
${strategy.key_programs}

Please provide a detailed strategy that includes:
1. Executive Summary
2. Funding Goals and Objectives
3. Donor Strategy
4. Fundraising Methods and Tactics
5. Budget Allocation
6. Success Metrics
7. Risk Management
8. Implementation Timeline

Format the response as JSON with these sections as keys.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert fundraising strategist who creates comprehensive, data-driven fundraising strategies."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('Failed to generate strategy content');
    }

    const strategyContent = JSON.parse(content);

    // Generate insights and recommendations
    const insightsPrompt = `Based on the following fundraising strategy, provide:
1. 3 key insights about the organization's fundraising potential and challenges
2. 5 actionable recommendations for successful implementation

Strategy:
${JSON.stringify(strategyContent, null, 2)}

Format the response as JSON with two arrays: "insights" and "recommendations".`;

    const insightsCompletion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert fundraising strategist who provides data-driven insights and actionable recommendations."
        },
        {
          role: "user",
          content: insightsPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const insightsContent = insightsCompletion.choices[0].message.content;
    if (!insightsContent) {
      throw new Error('Failed to generate insights content');
    }

    const { insights, recommendations } = JSON.parse(insightsContent);

    // Update the strategy with generated content
    const { error: updateError } = await supabase
      .from('fundraising_strategies')
      .update({
        strategy_content: JSON.stringify(strategyContent),
        insights,
        recommendations,
        status: 'active',
      })
      .eq('id', strategyId);

    if (updateError) throw updateError;

    // Create initial metrics
    const metrics = [
      {
        name: 'Total Funds Raised',
        target: strategy.target_amount,
        current: 0,
        unit: 'USD',
      },
      {
        name: 'Number of Donors',
        target: strategy.current_donors * 2, // Double the current donors
        current: strategy.current_donors,
        unit: 'donors',
      },
      {
        name: 'Average Donation',
        target: strategy.target_amount / (strategy.current_donors * 2),
        current: 0,
        unit: 'USD',
      },
    ];

    const { error: metricsError } = await supabase
      .from('fundraising_metrics')
      .insert(
        metrics.map(metric => ({
          strategy_id: strategyId,
          ...metric,
        }))
      );

    if (metricsError) throw metricsError;

    return {
      strategy: strategyContent,
      insights,
      recommendations,
      metrics,
    };
  },

  async updateProgress(strategyId: string, progress: number) {
    const supabase = createClientComponentClient();
    
    const { error } = await supabase
      .from('fundraising_strategies')
      .update({
        progress,
        status: progress >= 100 ? 'completed' : 'active',
      })
      .eq('id', strategyId);

    if (error) throw error;
  },

  async generateInsights(strategyId: string) {
    const supabase = createClientComponentClient();
    
    // Fetch the strategy data
    const { data: strategy, error: strategyError } = await supabase
      .from('fundraising_strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (strategyError) throw strategyError;
    if (!strategy) throw new Error('Strategy not found');

    // Generate updated insights based on current progress
    const prompt = `Analyze the following fundraising strategy and provide updated insights and recommendations based on its current progress and status.

Strategy Details:
- Organization: ${strategy.organization_name}
- Type: ${strategy.organization_type}
- Target Amount: $${strategy.target_amount}
- Current Progress: ${strategy.progress}%
- Status: ${strategy.status}
- Timeframe: ${strategy.timeframe}
- Current Donors: ${strategy.current_donors}

Mission:
${strategy.mission}

Key Programs:
${strategy.key_programs}

Previous Fundraising Experience:
${strategy.previous_fundraising}

Current Strategy:
${strategy.strategy_content}

Based on this information, please provide:
1. 3 key insights about the current fundraising progress and potential
2. 5 actionable recommendations for improving or maintaining momentum

Format the response as JSON with two arrays: "insights" and "recommendations".`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert fundraising strategist who provides data-driven insights and actionable recommendations based on current progress and context."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('Failed to generate insights content');
    }

    const { insights, recommendations } = JSON.parse(content);

    // Update the strategy with new insights
    const { error: updateError } = await supabase
      .from('fundraising_strategies')
      .update({
        insights,
        recommendations,
      })
      .eq('id', strategyId);

    if (updateError) throw updateError;

    return {
      insights,
      recommendations,
    };
  },

  async linkStrategies(sourceId: string, targetId: string) {
    const supabase = createClientComponentClient();
    
    const { error } = await supabase
      .from('fundraising_strategies')
      .update({
        related_strategy_id: targetId,
      })
      .eq('id', sourceId);

    if (error) throw error;
  },
}; 