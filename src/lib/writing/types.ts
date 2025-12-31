export type RichTextContent = {
  type: string;
  text: {
    content: string;
    link?: string | undefined;
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
};

export type ProcessedBlock = {
  id: string;
  type: string;
  content: RichTextContent[];
  language?: string;
  tableWidth?: number;
  hasColumnHeader?: boolean;
  hasRowHeader?: boolean;
  cells?: any[][];
  tableRows?: ProcessedBlock[];
  mathHtml?: string;
};

export type NotionItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  createdTime: string;
  published?: string;
  previewBlocks?: ProcessedBlock[];
  source?: string;
  slug?: string;
  excerpt?: string;
  featureImage?: string;
};
