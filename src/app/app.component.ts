import { Component } from '@angular/core';

interface ElementInfo {
  name: string;
  meta?: Map<string, string>[];
}

interface DetailState {
  progress: number;
  elements: ElementInfo[];
}

interface Detail {
  id?: number;
  name: string;
  status: string;
  type: string;
  created: Date;
  updated: Date;
  addition: string;
  state: DetailState;
}

const DETAILS: Detail[] = [
  {
    name: 'Деталь 1',
    type: 'Тип 1',
    status: 'В разработке',
    created: new Date('1995-12-17T03:24:00'),
    addition: '-',
    updated: new Date('1995-12-17T03:24:00'),
    state: {
      elements: [{name: 'Шаг 1'}, {name: 'Шаг 2'}, {name: 'Шаг 3'}, {name: 'Шаг 4'}, {name: 'Шаг 5'}],
      progress: 1
    }
  },
  {
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
    name: 'Деталь 3',
    type: 'Тип 3',
    status: 'В разработке',
    created: new Date('1995-12-17T03:24:00'),
    addition: '-',
    updated: new Date('1995-12-17T03:24:00'),
    state: {
      elements: [{name: 'Шаг 1'}, {name: 'Шаг 2'}, {name: 'Шаг 3'}, {name: 'Шаг 4'}, {name: 'Шаг 5'}],
      progress: 5
    }
  }
];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  activeDetail: Detail;

  detailTypes = DETAILS.map(a => a.type );

  page = 1;
  pageSize = 50;
  collectionSize = DETAILS.length;

  get details(): Detail[] {
    return DETAILS
      .map((detail, i) => ({id: i + 1, ...detail}))
      .slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
  }

  changeActiveDetail(detail: Detail) {
    this.activeDetail = detail;
  }

  generateStatus(detail: Detail): string {
    const current = detail.state.progress + 1;
    const total = detail.state.elements.length;
    return `${detail.status} [${current}/${total}]`;
  }
}
