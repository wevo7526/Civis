'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

interface GanttChartProps {
  data: any[];
  links: any[];
}

const GanttChart = ({ data, links }: GanttChartProps) => {
  const ganttContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initGantt = async () => {
      if (!ganttContainer.current) return;

      // Dynamically import gantt only on client side
      const gantt = (await import('dhtmlx-gantt')).default;
      await import('dhtmlx-gantt/codebase/dhtmlxgantt.css');

      // Configure gantt
      gantt.config.date_format = '%Y-%m-%d';
      gantt.config.columns = [
        { name: 'text', label: 'Task', tree: true, width: 200 },
        { name: 'start_date', label: 'Start', align: 'center', width: 100 },
        { name: 'end_date', label: 'End', align: 'center', width: 100 },
        { name: 'status', label: 'Status', align: 'center', width: 100 },
      ];

      // Initialize gantt
      gantt.init(ganttContainer.current);
      gantt.parse({ data, links });
    };

    initGantt();

    // Cleanup
    return () => {
      if (ganttContainer.current) {
        const gantt = (window as any).gantt;
        if (gantt) {
          gantt.clearAll();
        }
      }
    };
  }, [data, links]);

  return (
    <div 
      ref={ganttContainer} 
      style={{ width: '100%', height: '500px' }}
    />
  );
};

export default GanttChart; 