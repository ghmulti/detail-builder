import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { v4 as uuid } from 'uuid';

const output = console.log;

function buildRandomId(): string {
  // return Math.random().toString(36).substring(7);
  return uuid();
}

interface ElementInfo {
  name: string;
  location?: string;
  comments?: string[];
  completedAt?: Date;
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
  activeTemplateJson: string;

  // detailTypes = Array.from(this.details.values()).map(a => a.type );

  page = 1;
  pageSize = 50;

  templates = Object.assign([], TEMPLATES);
  products: Product[] = Object.assign([], PRODUCTS);
  productSearch = '';

  newDatailEntry: Detail;
  newProductEntry: Product;
  newDetailTemplateJson: string;
  newTemplate: DetailTemplate;

  changeActiveDetail(detail: Detail) {
    this.activeDetail = detail;
  }

  generateStatus(detail: Detail): string {
    const current = detail.state.progress;
    const total = detail.state.elements.length;
    return `${detail.status} [${current}/${total}]`;
  }

  activeDetailStateComplete() {
    this.activeDetail.state.elements[this.activeDetail.state.progress].completedAt = new Date();
    this.activeDetail.state.progress += 1;
    if (this.activeDetail.state.progress === this.activeDetail.state.elements.length) {
      this.activeDetail.status = 'Готово';
    }
  }

  changeActiveTemplate(template: DetailTemplate) {
    this.activeTemplate = template;
    this.activeTemplateJson = JSON.stringify(this.activeTemplate.elements, undefined, 2);
  }

  updateActiveTemplate() {
    this.activeTemplate.elements = JSON.parse(this.activeTemplateJson);
  }

  addDetail(product: Product, detail: Detail) {
    this.details.set(detail.id, detail);
    this.detailsSize++;
    product.detailIds.push(detail.id);
  }

  addProduct(product: Product) {
    this.products.push(product);
  }

  addTemplate(template: DetailTemplate) {
    this.templates.push(template);
  }

  newDetailDialog(product: Product, content) {
    this.newDatailEntry = {
      state: {progress: 0, elements: []},
      name: '',
      status: 'В разработке',
      addition: '',
      type: '',
      id : buildRandomId()
    };
    this.newDetailTemplateJson = '';
    this.modalService.open(content, {windowClass : 'myCustomModalClass', size: 'lg', ariaLabelledBy: 'modal-basic-title'})
      .result.then((result) => {
        this.newDatailEntry.created = new Date();
        this.newDatailEntry.updated = new Date();
        this.newDatailEntry.state.elements = JSON.parse(this.newDetailTemplateJson);
        output(this.newDatailEntry);
        this.addDetail(product, this.newDatailEntry);
      }, (reason) => { output('rejected'); });
  }

  changeNewDetailTemplate(template: DetailTemplate) {
    this.newDetailTemplateJson = JSON.stringify(template.elements, undefined, 2);
  }

  newProductDialog(content) {
    this.newProductEntry = {
      name: '',
      detailIds: [],
      id : buildRandomId()
    };
    this.modalService.open(content, {windowClass : 'myCustomModalClass', size: 'lg', ariaLabelledBy: 'modal-basic-title'})
      .result.then((result) => {
      this.newProductEntry.created = new Date();
      this.newProductEntry.updated = new Date();
      output(this.newProductEntry);
      this.addProduct(this.newProductEntry);
    }, (reason) => { output('rejected'); });
  }

  newTemplateDialog(content) {
    this.newTemplate = {
      elements: Object.assign([], DEFAULT_TEMPLATE_ELEMENTS),
      name: ''
    };
    this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'})
      .result.then((result) => {
      this.addTemplate(this.newTemplate);
    }, (reason) => { output('rejected'); });
  }
}
