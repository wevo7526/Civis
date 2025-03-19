declare module 'dhtmlx-gantt' {
  interface GanttConfig {
    date_format?: string;
    columns?: Array<{
      name: string;
      label: string;
      tree?: boolean;
      width?: number;
      align?: string;
    }>;
  }

  interface GanttTask {
    id: string | number;
    text: string;
    start_date: Date;
    end_date: Date;
    status?: string;
    priority?: string;
    progress?: number;
    dependencies?: string;
  }

  interface GanttData {
    data: GanttTask[];
  }

  interface Gantt {
    config: GanttConfig;
    clearAll(): void;
    parse(data: GanttData): void;
    render(): void;
  }

  const gantt: Gantt;
  export = gantt;
} 