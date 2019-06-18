import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {BackendService} from './backend.service';
import {buildRandomId, Detail, DetailTemplate, ElementInfo, Product, Alert, SyncObj} from './domain';
import {Observable, Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {debounceTime, map} from 'rxjs/operators';
import {distinctUntilChanged} from 'rxjs/internal/operators/distinctUntilChanged';

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

  constructor(
    private modalService: NgbModal,
    private backendService: BackendService,
    private route: ActivatedRoute,
    private ref: ChangeDetectorRef
  ) {
    this.route.queryParams.subscribe(params => {
      this.route.fragment.pipe(
        map(fragment => {
          const sp = new URLSearchParams(fragment);
          return {
            idToken: sp.get('id_token'),
            insecure: sp.get('insecure'),
            accessToken: sp.get('access_token')
          };
        })
      ).subscribe(({idToken, insecure, accessToken}) => {
        this.idToken = idToken;
        this.insecure = insecure;
        this.accessToken = accessToken;
      });
    });
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
  accessToken: string;
  insecure: string;
  alerts: Alert[] = [];

  listOfFiles = [];

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

  deleteProduct(product: Product) {
    if (product.detailIds.length > 0) {
      product.detailIds.forEach((detailId) => { this.backendService.deleteDetail(detailId); });
      if (this.activeDetail != null && product.detailIds.indexOf(this.activeDetail.id) >= 0) {
        this.activeDetail = null;
        this.activeTemplateJson = '';
      }
    }
    this.backendService.deletePorduct(product.id);
  }

  deleteActiveDetail() {
    if (this.activeDetail == null) {
      return;
    }
    if (this.activeDetail.productId != null) {
      const targetProduct = this.products.find((prod: Product) => prod.id === this.activeDetail.productId);
      if (targetProduct != null) {
        targetProduct.detailIds.splice(targetProduct.detailIds.indexOf(this.activeDetail.productId), 1);
        this.backendService.saveOrUpdateProduct(targetProduct);
      }
    }
    this.backendService.deleteDetail(this.activeDetail.id);
    this.activeDetail = null;
  }

  deleteActiveTemplate() {
    if (this.activeTemplate == null) {
      return;
    }
    this.backendService.deleteTemplate(this.activeTemplate.id);
    this.activeTemplate = null;
    this.activeTemplateJson = '';
  }

  newDetailDialog(product: Product, content) {
    this.newDetailEntry = {
      state: {progress: 0, elements: []},
      name: '',
      status: 'В разработке',
      addition: '',
      type: '',
      id : buildRandomId(),
      productId: product.id,
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

  newDetailTemplateSearch = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => this.templates.filter(nm => nm.name.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    )

  newDetailTemplateFormatter = (x: {name: string}) => x.name;

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
    this.backendService.exportData(this.idToken).then((x) => {
      this.alerts.push({
        type: 'success',
        message: `Успешно экспортировано`
      });
    }, (err: Error) => {
      output(`Error ${err.message}`);
      this.alerts.push({
        type: 'danger',
        message: `Ошибка при экспорте: ${err.message}`
      });
    });
  }

  importData() {
    this.backendService.importData(this.idToken).then((x: SyncObj) => {
      output('Response: ', x);
      this.alerts.push({
        type: 'success',
        message: `Успешно импортировано`
      });
      this.backendService.saveOrUpdateSyncObject(x);
    }, (err: Error) => {
      output(`Error ${err.message}`);
      this.alerts.push({
        type: 'danger',
        message: `Ошибка при импорте: ${err.message}`
      });
    });
  }

  cleanupData() {
    const defaultTemplateId = buildRandomId();
    this.backendService.saveOrUpdateSyncObject({
      details: [],
      products: [],
      templates: [[defaultTemplateId, {
        id: defaultTemplateId,
        elements: Object.assign([], DEFAULT_TEMPLATE_ELEMENTS),
        name: 'Дефолтный шаблон'
      }]]
    });
  }

  closeAlert(alert: Alert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
  }

  detailProgress(detail: Detail): string {
    return (100 * detail.state.progress / detail.state.elements.length).toPrecision(3).toString();
  }

  productProgress(product: Product): string {
    try {
      return (
        product.detailIds
          .map(x => this.details.get(x))
          .filter(x => x != null)
          .map(detail => (100 * detail.state.progress / detail.state.elements.length))
          .reduce((x, y) => x + y
          ) / product.detailIds.length).toPrecision(3).toString();
    } catch (e) {
      console.error('error while calculating product progress', e);
    }
  }

  loadFilesFromS3() {
    // @ts-ignore
    AWS.config.region = 'eu-west-1';
    // @ts-ignore
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: 'eu-west-1:90b5154a-c51c-47da-a305-6b05746095ab',
      Logins: {
        'cognito-idp.eu-west-1.amazonaws.com/eu-west-1_vBUOw4rvl': this.idToken
      }
    });

    const username = this.parseJwt(this.idToken)['cognito:username'];

    // @ts-ignore
    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {Bucket: 'detail-builder-files'}
    });
    s3.listObjects({Delimiter: '/', Prefix: username + '/'}, (err, data) => {
      if (err) {
        this.listOfFiles = [];
        return alert('There was an error listing your albums: ' + err.message);
      } else {
        output('data', data);
        this.listOfFiles = data.Contents;
      }
      this.ref.detectChanges();
    });
  }

  parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  }
}
