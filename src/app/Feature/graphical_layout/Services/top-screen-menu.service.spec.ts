import { TestBed } from '@angular/core/testing';

import { TopScreenMenuService } from './top-screen-menu.service';

describe('TopScreenMenuService', () => {
  let service: TopScreenMenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TopScreenMenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
