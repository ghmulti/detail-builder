import {Detail, Product, DetailTemplate, ElementInfo, buildRandomId} from './domain';

const DETAILS: Detail[] = [
  {
    id: buildRandomId(),
    name: 'Деталь 1',
    type: 'Тип 1',
    status: 'В разработке',
    created: new Date('1995-12-17T03:24:00'),
    addition: '-',
    updated: new Date('1995-12-17T03:24:00'),
    state: {
      elements: [{name: 'Шаг 1', location: 'Цех 1', comments: []}, {name: 'Шаг 2'}, {name: 'Шаг 3'}, {name: 'Шаг 4'}, {name: 'Шаг 5'}],
      progress: 0
    }
  },
  {
    id: buildRandomId(),
    name: 'Деталь 2',
    type: 'Тип 2',
    status: 'В разработке',
    created: new Date('1995-12-17T03:24:00'),
    addition: '-',
    updated: new Date('1995-12-17T03:24:00'),
    state: {
      elements: [
        {name: 'Шаг 1', completedAt: new Date()},
        {name: 'Шаг 2', completedAt: new Date()},
        {name: 'Шаг 3', completedAt: new Date()},
        {name: 'Шаг 4'},
        {name: 'Шаг 5'}
      ],
      progress: 3
    }
  },
  {
    id: buildRandomId(),
    name: 'Деталь 3',
    type: 'Тип 3',
    status: 'Готово',
    created: new Date('1995-12-17T03:24:00'),
    addition: '-',
    updated: new Date('1995-12-17T03:24:00'),
    state: {
      elements: [
        {name: 'Шаг 1', completedAt: new Date()},
        {name: 'Шаг 2', completedAt: new Date()},
        {name: 'Шаг 3', completedAt: new Date()},
        {name: 'Шаг 4', completedAt: new Date()},
        {name: 'Шаг 5', completedAt: new Date()}
      ],
      progress: 5
    }
  }
];

const PRODUCTS: Product[] = [
  {
    name: 'Изделие 1',
    created: new Date(),
    updated: new Date(),
    detailIds: DETAILS.map((v) => v.id)
  }
];

const DEFAULT_TEMPLATE_ELEMENTS: ElementInfo[] = [
  {
    name: 'Шаг 1',
    location: 'Цех 1',
    comments: []
  },
  {
    name: 'Шаг 2'
  }
];

const TEMPLATES: DetailTemplate[] = [
  {
    name: 'Шаблон детали 1',
    elements: DEFAULT_TEMPLATE_ELEMENTS
  }
];

export class BackendService {

  getProducts(): Product[] {
    return Object.assign([], PRODUCTS);
  }

  getDetails(): Map<string, Detail> {
    return Object.assign([], DETAILS).map((detail, i) => ({id: (i + 1).toString(), ...detail}))
      .reduce((agg: Map<string, Detail>, cv: Detail, ci) => agg.set(cv.id, cv), new Map<string, Detail>());
  }

  getTemplates(): DetailTemplate[] {
    return Object.assign([], TEMPLATES);
  }

  saveOrUpdateProduct(product: Product) {
  }

  saveOrUpdateDetail(detail: Detail) {
  }

  saveOrUpdateTemplate(template: DetailTemplate) {
  }

}
