export type MenuKey = 'line' | 'polygon' | 'shape3D' | 'gesture' | null;
export type ToolType = 'button' | 'dropdown' | 'image-upload';

export interface Tool {
  type: ToolType;
  icon: string;
  menuKey?: MenuKey;
  action?: () => void;
}

export interface DropdownItem {
  value: string;
  label: string;
  previewClass: string;
}

export interface Section {
  title: string;
  tools: Tool[];
}