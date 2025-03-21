declare module 'dhtmlx-gantt' {
  interface GanttConfig {
    date_format: string;
    columns: Array<{
      name: string;
      label: string;
      tree?: boolean;
      width?: number;
      align?: string;
    }>;
  }

  interface GanttData {
    data: Array<{
      id: string | number;
      text: string;
      start_date: string | Date;
      end_date: string | Date;
      status: string;
      progress: number;
    }>;
    links: Array<{
      id: string;
      source: string | number;
      target: string | number;
      type: string;
    }>;
  }

  interface Gantt {
    config: GanttConfig;
    init(container: HTMLElement): void;
    parse(data: GanttData): void;
    clearAll(): void;
    render(): void;
  }

  const gantt: Gantt;
  export default gantt;
}

declare module 'dhtmlx-gantt/codebase/dhtmlxgantt.css' {
  const content: any;
  export default content;
} 