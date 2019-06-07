import { v4 as uuid } from 'uuid';

export function buildRandomId(): string {
  // return Math.random().toString(36).substring(7);
  return uuid();
}

export interface Alert {
  type: string;
  message: string;
}

export interface SyncObj {
  templates: any;
  products: any;
  details: any;
}

export interface ElementInfo {
  name: string;
  location?: string;
  comments?: string[];
  completedAt?: Date;
  meta?: Map<string, string>[];
}

export interface DetailState {
  progress: number;
  elements: ElementInfo[];
}

export interface DetailTemplate {
  id: string;
  name: string;
  elements: ElementInfo[];
}

export interface Detail {
  id?: string;
  name: string;
  status: string;
  type: string;
  created?: Date;
  updated?: Date;
  addition: string;
  state: DetailState;
  productId?: string;
}

export interface Product {
  id: string;
  name: string;
  detailIds: string[];
  created?: Date;
  updated?: Date;
}
