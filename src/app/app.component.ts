import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {BackendService} from './backend.service';
import {Detail, Product, DetailTemplate, ElementInfo, buildRandomId} from './domain';

const output = console.log;

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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(
    private modalService: NgbModal,
    private backendService: BackendService
  ) {

    this.templates = this.backendService.getTemplates();
    this.products = this.backendService.getProducts();
    this.details = this.backendService.getDetails();
    this.detailsSize = Array.of(this.details.values()).length;
  }

  get pagedDetails(): Detail[] {
    return Array.from(this.details.values())
      .slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
  }

  get allDetails(): Detail[] {
    return Array.from(this.details.values());
  }

  details: Map<string, Detail>;
  detailsSize: number;
  detailSearch = '';

  activeDetail: Detail;
  activeTemplate: DetailTemplate;
  activeTemplateJson: string;

  page = 1;
  pageSize = 50;

  templates: DetailTemplate[];
  products: Product[];
  productSearch = '';

  newDetailEntry: Detail;
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
    this.newDetailEntry = {
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
        this.newDetailEntry.created = new Date();
        this.newDetailEntry.updated = new Date();
        this.newDetailEntry.state.elements = JSON.parse(this.newDetailTemplateJson);
        output(this.newDetailEntry);
        this.addDetail(product, this.newDetailEntry);
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
