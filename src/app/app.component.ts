import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {BackendService} from './backend.service';
import {buildRandomId, Detail, DetailTemplate, ElementInfo, Product} from './domain';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';

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
export class AppComponent implements OnInit, OnDestroy {

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

  detailSubscription: Subscription;
  productSubscription: Subscription;
  templateSubscription: Subscription;

  idToken: string;

  constructor(
    private modalService: NgbModal,
    private backendService: BackendService,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe(params => {
      this.idToken = params.id_token;
      output(`Token: ${this.idToken}`);
    });
  }

  ngOnInit() {
    this.productSubscription = this.backendService.products$.subscribe((x) => {
      this.products = Array.from(x.values());
    });
    this.templateSubscription = this.backendService.templates$.subscribe((v) => {
      this.templates = Array.from(v.values());
    });
    this.detailSubscription = this.backendService.details$.subscribe((v) => {
      this.details = v;
      this.detailsSize = Array.from(v.values()).length;
    });
  }

  ngOnDestroy() {
    this.productSubscription.unsubscribe();
    this.detailSubscription.unsubscribe();
    this.templateSubscription.unsubscribe();
  }

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
    this.backendService.saveOrUpdateDetail(this.activeDetail);
  }

  changeActiveTemplate(template: DetailTemplate) {
    this.activeTemplate = template;
    this.activeTemplateJson = JSON.stringify(this.activeTemplate.elements, undefined, 2);
  }

  updateActiveTemplate() {
    this.activeTemplate.elements = JSON.parse(this.activeTemplateJson);
  }

  addDetail(product: Product, detail: Detail) {
    this.backendService.saveOrUpdateDetail(detail);
    product.detailIds.push(detail.id);
    this.backendService.saveOrUpdateProduct(product);
  }

  addProduct(product: Product) {
    this.backendService.saveOrUpdateProduct(product);
  }

  addTemplate(template: DetailTemplate) {
    this.backendService.saveOrUpdateTemplate(template);
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
      id: buildRandomId(),
      elements: Object.assign([], DEFAULT_TEMPLATE_ELEMENTS),
      name: ''
    };
    this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'})
      .result.then((result) => {
      this.addTemplate(this.newTemplate);
    }, (reason) => { output('rejected'); });
  }

  exportData() {
    this.backendService.exportData(this.idToken);
  }

  importData() {
    this.backendService.importData(this.idToken);
  }
}
