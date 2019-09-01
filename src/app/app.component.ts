import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {BackendService} from './backend.service';
import {buildRandomId, Detail, DetailTemplate, ElementInfo, Product, Alert, SyncObj, Attachment} from './domain';
import {Observable, Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {debounceTime, map} from 'rxjs/operators';
import {distinctUntilChanged} from 'rxjs/internal/operators/distinctUntilChanged';
import {FormBuilder, FormGroup} from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

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
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
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
  activeDetailAttachment = { payload: null, presignedUrls: [] };
  activeTemplate: DetailTemplate;
  activeTemplateJson: string;
  comment: string;

  page = 1;
  pageSize = 50;

  templates: DetailTemplate[];
  products: Product[];
  productSearch = '';

  newDetailEntry: Detail;
  newProductEntry: Product;
  newDetailTemplateJson: string;
  newTemplate: DetailTemplate;
  selectedAttachments: Attachment[];

  detailSubscription: Subscription;
  productSubscription: Subscription;
  templateSubscription: Subscription;
  attachmentSubscription: Subscription;

  idToken: string;
  accessToken: string;
  insecure: string;
  alerts: Alert[] = [];

  currentAttachment = { payload: null };
  attachments: Attachment[];
  fileFormGroup: FormGroup;

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
    this.attachmentSubscription = this.backendService.attachments$.subscribe((v) => {
      this.attachments = Array.from(v.values());
    });

    this.fileFormGroup = this.formBuilder.group({
      document: ['']
    });
  }

  ngOnDestroy() {
    this.productSubscription.unsubscribe();
    this.detailSubscription.unsubscribe();
    this.templateSubscription.unsubscribe();
    this.attachmentSubscription.unsubscribe();
  }

  changeActiveDetail(detail: Detail) {
    this.activeDetail = detail;
    this.activeDetailAttachment = { payload: null, presignedUrls: [] };
    this.preloadAttachments();
  }

  generateStatus(detail: Detail): string {
    const current = detail.state.progress;
    const total = detail.state.elements.length;
    return `${detail.status} [${current}/${total}]`;
  }

  activeDetailStateComplete() {
    const currentState = this.activeDetail.state.elements[this.activeDetail.state.progress];
    currentState.completedAt = new Date();
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
    try {
      this.activeTemplate.elements = JSON.parse(this.activeTemplateJson);
      this.backendService.saveOrUpdateTemplate(this.activeTemplate);
    } catch (err) {
      this.alerts.push({
        type: 'danger',
        message: `Ошибка при сохранении: ${err.message}`
      });
    }
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
        this.changeActiveDetail(null);
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
    this.changeActiveDetail(null);
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

  appendAttachmentDialog(content) {
    this.selectedAttachments = [];
    this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'})
      .result.then((result) => {
        this.activeDetail.attachments = this.selectedAttachments;
        this.backendService.saveOrUpdateDetail(this.activeDetail);
      }, (reason) => { output('rejected'); });
  }

  processDetailCommentDialog(content, stateIndex, commentIndex = -1) {
    const currentState = this.activeDetail.state.elements[stateIndex];
    this.comment = stateIndex >= 0 && commentIndex >= 0 ? currentState.comments[commentIndex] : '';
    this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'})
      .result.then((result) => {
        if (!currentState.comments) {
          currentState.comments = [];
        }
        if (commentIndex < 0) {
          currentState.comments.push(this.comment);
        } else {
          currentState.comments[commentIndex] = this.comment;
        }
        this.backendService.saveOrUpdateDetail(this.activeDetail);
      }, (reason) => { output('rejected'); });
  }

  toggleAppendAttachment(attachment: Attachment) {
    if (this.selectedAttachments.indexOf(attachment) === -1) {
      this.selectedAttachments.push(attachment);
    } else {
      this.selectedAttachments.splice(this.selectedAttachments.indexOf(attachment), 1);
    }
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
      attachments: [],
      templates: [[defaultTemplateId, {
        id: defaultTemplateId,
        elements: Object.assign([], DEFAULT_TEMPLATE_ELEMENTS),
        name: 'Дефолтный шаблон'
      }]]
    });
  }

  closeAlert(alert: Alert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
    this.ref.detectChanges();
  }

  detailProgress(detail: Detail): string {
    return (100 * detail.state.progress / detail.state.elements.length).toPrecision(3).toString();
  }

  productProgress(product: Product): string {
    if (product.detailIds.length === 0) {
      return '0.00';
    }
    try {
      return (
        product.detailIds
          .map(x => this.details.get(x))
          .filter(x => x != null)
          .map(detail => (100 * detail.state.progress / detail.state.elements.length))
          .reduce((x, y) => x + y, 0) / product.detailIds.length).toPrecision(3).toString();
    } catch (e) {
      console.error('error while calculating product progress', e);
    }
  }

  loadFilesFromS3() {
    this.configureAws();
    const prefix = this.getS3Prefix();

    // @ts-ignore
    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {Bucket: 'detail-builder-files'}
    });
    s3.listObjects({Delimiter: '/', Prefix: prefix + '/'}, (err, data) => {
      if (err) {
        this.alerts.push({
          type: 'danger',
          message: `Ошибка при загрузке списка ${err.message}`
        });
      } else {
        // output('data', data);
        const atts = data.Contents
          .map(x => ({id: x.Key, name: x.Key.split('/')[1].trim() }))
          .filter(x => x.name.length > 0);
        output(atts);
        this.backendService.saveOrUpdateAttachments(atts);
      }
      this.ref.detectChanges();
    });
  }

  configureAws() {
    // @ts-ignore
    AWS.config.region = 'eu-west-1';
    // @ts-ignore
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: 'eu-west-1:90b5154a-c51c-47da-a305-6b05746095ab',
      Logins: {
        'cognito-idp.eu-west-1.amazonaws.com/eu-west-1_vBUOw4rvl': this.idToken
      }
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

  getS3Prefix() {
    // @ts-ignore
    return AWS.config.credentials.identityId;
    // const username = this.parseJwt(this.idToken)['cognito:username'];
    // return `620978346410:${username}`;
  }

  onFileChange(event) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.fileFormGroup.get('document').setValue(file);
    }
  }

  onSubmit() {
    const file = this.fileFormGroup.get('document').value;
    if (!file) {
      console.log('File not choosen');
      return;
    }

    const fileName = file.name;
    this.configureAws();
    const prefix = this.getS3Prefix();

    // @ts-ignore
    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {Bucket: 'detail-builder-files'}
    });
    s3.upload({
      Key: `${prefix}/${fileName}`,
      Body: file,
    }, (err, data) => {
      if (err) {
        this.alerts.push({
          type: 'danger',
          message: `Ошибка при загрузке файла ${err.message}`
        });
      } else {
        this.alerts.push({
          type: 'success',
          message: `Файл успешно загружен`
        });
      }
      this.ref.detectChanges();
      this.loadFilesFromS3();
    });
  }

  downloadFile(file: Attachment, target) {
    if (file.id.split('.').pop() !== 'jpg') {
      this.alerts.push({
        type: 'danger',
        message: `Просмотр доступен только для jpg формата`
      });
      return;
    }

    this.configureAws();

    // @ts-ignore
    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {Bucket: 'detail-builder-files'}
    });
    s3.getObject(
      { Bucket:  'detail-builder-files', Key: file.id }, (err, data) => {
        if (err) {
          this.alerts.push({
            type: 'danger',
            message: `Ошибка при загрузке файла ${err.message}`
          });
        } else {
          this.alerts.push({
            type: 'success',
            message: `Файл успешно загружен`
          });
        }
        const payload =  'data:image/jpeg;base64,' + this.encode(data.Body);
        target.payload = this.sanitizer.bypassSecurityTrustUrl(payload);
        this.ref.detectChanges();
      }
    );
  }

  encode(data) {
    const str = data.reduce((a, b) => a + String.fromCharCode(b), '');
    return btoa(str).replace(/.{76}(?=.)/g, '$&\n');
  }

  preloadAttachments() {
    if (this.activeDetail == null || this.activeDetail.attachments == null) {
      return;
    }
    if (this.idToken == null) {
      return;
    }

    this.configureAws();

    // @ts-ignore
    const s3 = new AWS.S3({region: 'eu-west-1'});
    const signedUrlExpireSeconds = 60 * 5;
    const promises = this.activeDetail.attachments.map((att) => {
      return new Promise((resolve, reject) => {
        s3.getSignedUrl('getObject', {
          Bucket: 'detail-builder-files',
          Key: att.id,
          Expires: signedUrlExpireSeconds
        }, (err, url) => {
          if (err != null) {
            reject(err);
          } else {
            resolve(url);
          }
        });
      });
    });

    Promise.all(promises).then((values) => {
      this.activeDetailAttachment.presignedUrls = values;
    });
  }
}
