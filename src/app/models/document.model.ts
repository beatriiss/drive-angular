export interface Document {
  id: string;
  name: string;
  type: 'folder' | 'document' | 'spreadsheet' | 'presentation' | 'image' | 'pdf';
  size?: number;
  modifiedAt: Date;
  createdAt: Date;
  owner: string;
  path: string;
  starred: boolean;
  shared: boolean;
  parentId?: string;
}
