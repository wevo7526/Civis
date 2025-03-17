import { ChartBarIcon, DocumentTextIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface AIInsightsPanelProps {
  title?: string;
  insights: {
    title: string;
    content: string;
    icon?: React.ReactNode;
  }[];
  className?: string;
}

export default function AIInsightsPanel({ 
  title = 'AI Insights', 
  insights, 
  className = '' 
}: AIInsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center text-gray-500">
          <SparklesIcon className="h-5 w-5 mr-2" />
          <p>AI insights will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-6">
        {insights.map((insight, index) => (
          <div key={index}>
            <div className="flex items-center mb-2">
              {insight.icon || <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />}
              <h3 className="font-medium">{insight.title}</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
              {insight.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 