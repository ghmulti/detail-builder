import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

const output = console.log;

interface ElementInfo {
  name: string;
  location?: string;
  comments?: string[];
  meta?: Map<string, string>[];
}

interface DetailState {
  progress: number;
  elements: ElementInfo[];
}

interface DetailTemplate {
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
}

export interface Product {
  id?: string;
  name: string;
  detailIds: string[];
  created?: Date;
  updated?: Date;
}

const TEMPLATES: DetailTemplate[] = [
  {
    name: 'Шаблон детали 1',
    elements: [
      {
        name: 'Шаг 1',
        location: 'Цех 1',
        comments: []
      },
      {
        name: 'Шаг 2'
      },
      {
        name: 'Шаг 3'
      },
      {
        name: 'Шаг 4'
      }
    ]
  }
];

const DETAILS: Detail[] = [
  {
    id: Math.random().toString(36).substring(7),
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
    id: Math.random().toString(36).substring(7),
    name: 'Деталь 2',
    type: 'Тип 2',
    status: 'В разработке',
    created: new Date('1995-12-17T03:24:00'),
    addition: '-',
    updated: new Date('1995-12-17T03:24:00'),
    state: {
      elements: [{name: 'Шаг 1'}, {name: 'Шаг 2'}, {name: 'Шаг 3'}, {name: 'Шаг 4'}, {name: 'Шаг 5'}],
      progress: 3
    }
  },
  {
    id: Math.random().toString(36).substring(7),
    name: 'Деталь 3',
    type: 'Тип 3',
    status: 'Готово',
    created: new Date('1995-12-17T03:24:00'),
    addition: '-',
    updated: new Date('1995-12-17T03:24:00'),
    state: {
      elements: [{name: 'Шаг 1'}, {name: 'Шаг 2'}, {name: 'Шаг 3'}, {name: 'Шаг 4'}, {name: 'Шаг 5'}],
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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(private modalService: NgbModal) {}

  get pagedDetails(): Detail[] {
    return Array.from(this.details.values())
      .slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
  }

  get allDetails(): Detail[] {
    return Array.from(this.details.values());
  }

  details: Map<string, Detail> = Object.assign([], DETAILS).map((detail, i) => ({id: (i + 1).toString(), ...detail}))
    .reduce((agg: Map<string, Detail>, cv: Detail, ci) => agg.set(cv.id, cv), new Map<string, Detail>());

  detailsSize = DETAILS.length;
  detailSearch = '';

  activeDetail: Detail;
  activeTemplate: DetailTemplate;

  // detailTypes = Array.from(this.details.values()).map(a => a.type );

  page = 1;
  pageSize = 50;

  templates = Object.assign([], TEMPLATES);
  products: Product[] = Object.assign([], PRODUCTS);
  productSearch = '';

  newDatailEntry: Detail;
  newProductEntry: Product;

  changeActiveDetail(detail: Detail) {
    this.activeDetail = detail;
  }

  generateStatus(detail: Detail): string {
    const current = detail.state.progress;
    const total = detail.state.elements.length;
    return `${detail.status} [${current}/${total}]`;
  }

  activeDetailStateComplete() {
    this.activeDetail.state.progress += 1;
    if (this.activeDetail.state.progress === this.activeDetail.state.elements.length) {
      this.activeDetail.status = 'Готово';
    }
  }

  changeActiveTemplate(template: DetailTemplate) {
    this.activeTemplate = template;
  }

  templateJson(): string {
    return JSON.stringify(this.activeTemplate.elements, undefined, 2);
  }

  addDetail(product: Product, detail: Detail) {
    this.details.set(this.newDatailEntry.id, this.newDatailEntry);
    this.detailsSize++;
    product.detailIds.push(detail.id);
  }

  addProduct(product: Product) {
    this.products.push(product);
  }

  newDetail(product: Product, content) {
    this.newDatailEntry = {
      state: {progress: 0, elements: []},
      name: '',
      status: 'В разработке',
      addition: '',
      type: '',
      id : Math.random().toString(36).substring(7)
    };
    this.modalService.open(content, {windowClass : 'myCustomModalClass', size: 'lg', ariaLabelledBy: 'modal-basic-title'})
      .result.then((result) => {
        this.newDatailEntry.created = new Date();
        this.newDatailEntry.updated = new Date();
        this.newDatailEntry.state.elements = Object.assign([], this.activeTemplate.elements);
        output(this.newDatailEntry);
        this.addDetail(product, this.newDatailEntry);
      }, (reason) => { output('rejected'); });
  }

  newProduct(content) {
    this.newProductEntry = {
      name: '',
      detailIds: [],
      id : Math.random().toString(36).substring(7)
    };
    this.modalService.open(content, {windowClass : 'myCustomModalClass', size: 'lg', ariaLabelledBy: 'modal-basic-title'})
      .result.then((result) => {
      this.newProductEntry.created = new Date();
      this.newProductEntry.updated = new Date();
      output(this.newProductEntry);
      this.addProduct(this.newProductEntry);
    }, (reason) => { output('rejected'); });
  }
}
