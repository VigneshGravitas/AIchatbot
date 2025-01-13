export interface Tool {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description?: string;
}

export interface ProductSearchResponse {
  status: 'success' | 'error';
  products?: Product[];
  total?: number;
  message?: string;
}
