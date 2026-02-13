export interface Category {
  _id: string;
  name: string;
  description?: string;
  parentId?: string;

  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}
