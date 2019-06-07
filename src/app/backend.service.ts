import {Detail, DetailTemplate, ElementInfo, Product, SyncObj} from './domain';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

@Injectable()
export class BackendService {

  details = new BehaviorSubject<Map<string, Detail>>(new Map<string, Detail>());
  products = new BehaviorSubject<Map<string, Product>>(new Map<string, Product>());
  templates = new BehaviorSubject<Map<string, DetailTemplate>>(new Map<string, DetailTemplate>());

  constructor(
    private http: HttpClient
  ) {
    const productsJson = localStorage.getItem(`products`);
    const prods = productsJson != null ? new Map<string, Product>(JSON.parse(productsJson)) : new Map<string, Product>();
    this.products.next(prods);

    const detailsJson = localStorage.getItem(`details`);
    const dets = detailsJson != null ? new Map<string, Detail>(JSON.parse(detailsJson)) : new Map<string, Detail>();
    this.details.next(dets);

    const templatesJson = localStorage.getItem(`templates`);
    const temps = templatesJson != null ? new Map<string, DetailTemplate>(JSON.parse(templatesJson)) : new Map<string, DetailTemplate>();
    this.templates.next(temps);
  }

  get products$() { return this.products.asObservable(); }
  get details$() { return this.details.asObservable(); }
  get templates$() { return this.templates.asObservable(); }


  saveOrUpdateProduct(product: Product) {
    const newMap = this.products.getValue().set(product.id, product);
    localStorage.setItem('products', JSON.stringify(Array.from(newMap.entries())));
    this.products.next(newMap);
  }

  saveOrUpdateDetail(detail: Detail) {
    const newMap = this.details.getValue().set(detail.id, detail);
    this.details.next(newMap);
    localStorage.setItem(`details`, JSON.stringify(Array.from(newMap.entries())));
  }

  saveOrUpdateTemplate(template: DetailTemplate) {
    const newMap = this.templates.getValue().set(template.id, template);
    this.templates.next(newMap);
    localStorage.setItem(`templates`, JSON.stringify(Array.from(newMap.entries())));
  }

  exportData(idToken: string) {
    const body = JSON.stringify(
      {
        templates: Array.from(this.templates.getValue().entries()),
        products: Array.from(this.products.getValue().entries()),
        details: Array.from(this.details.getValue().entries())
      }
    );
    return this.http.post('https://hfofod4c8d.execute-api.eu-west-1.amazonaws.com/dev/sync', body , {headers: { Authorization: idToken }})
      .toPromise();
  }

  importData(idToken: string) {
    return this.http
      .get('https://hfofod4c8d.execute-api.eu-west-1.amazonaws.com/dev/sync', {headers: { Authorization: idToken }})
      .toPromise();
  }

  saveOrUpdateSyncObject(so: SyncObj) {
    localStorage.setItem(`templates`, JSON.stringify(so.templates));
    localStorage.setItem(`details`, JSON.stringify(so.details));
    localStorage.setItem(`products`, JSON.stringify(so.products));
  }
}
