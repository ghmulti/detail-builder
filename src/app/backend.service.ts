import {Detail, DetailTemplate, ElementInfo, Product} from './domain';
import {BehaviorSubject} from 'rxjs';

export class BackendService {

  details = new BehaviorSubject<Map<string, Detail>>(new Map<string, Detail>());
  products = new BehaviorSubject<Map<string, Product>>(new Map<string, Product>());
  templates = new BehaviorSubject<Map<string, DetailTemplate>>(new Map<string, DetailTemplate>());

  constructor() {
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

}
