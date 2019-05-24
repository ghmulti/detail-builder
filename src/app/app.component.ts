import { Component } from '@angular/core';

interface Detail {
  id?: number;
  name: string;
  status: string;
  type: string;
  created: Date;
  updated: Date;
  addition: string;
}

const DETAILS: Detail[] = [
  {
    name: 'Деталь 1',
    type: 'Тип 1',
    status: '2/30',
    created: new Date('1995-12-17T03:24:00'),
    addition: '-',
    updated: new Date('1995-12-17T03:24:00')
  },
  {
    name: 'Деталь 2',
    status: '2/30',
    type: 'Тип 2',
    created: new Date('1995-12-17T03:24:00'),
    addition: '-',
    updated: new Date('1995-12-17T03:24:00')
  },
  {
    name: 'Деталь 3',
    type: 'Тип 3',
    status: '2/30',
    created: new Date('1995-12-17T03:24:00'),
    addition: '-',
    updated: new Date('1995-12-17T03:24:00')
  }
];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  activeDetail:Detail;

  detailTypes = DETAILS.map(a => a.type );

  page = 1;
  pageSize = 50;
  collectionSize = DETAILS.length;

  get details(): Detail[] {
    return DETAILS
      .map((detail, i) => ({id: i + 1, ...detail}))
      .slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
  }

  changeActiveDetail(detail) {
    this.activeDetail = detail;
  }
}
