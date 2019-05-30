import {Pipe, PipeTransform} from '@angular/core';
import {Product, Detail} from './app.component';

@Pipe({
  name: 'searchProd'
})
export class SearchProductPipe implements PipeTransform {
  public transform(value: Product[], keys: string, term: string): Product[] {
    if (!term) { return value; }
    return (value || []).filter(item => keys.split(',').some(key => item.hasOwnProperty(key) && new RegExp(term, 'gi').test(item[key])));

  }
}

@Pipe({
  name: 'searchDet'
})
export class SearchDetailPipe implements PipeTransform {
  public transform(value: Detail[], keys: string, term: string): Detail[] {
    if (!term) { return value; }
    return (value || []).filter(item => keys.split(',').some(key => item.hasOwnProperty(key) && new RegExp(term, 'gi').test(item[key])));

  }
}
