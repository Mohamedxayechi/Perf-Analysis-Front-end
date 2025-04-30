import { TestBed } from '@angular/core/testing';

import { ShapeDrawingService } from './shape-drawing.service';

describe('ShapeDrawingService', () => {
  let service: ShapeDrawingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShapeDrawingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
