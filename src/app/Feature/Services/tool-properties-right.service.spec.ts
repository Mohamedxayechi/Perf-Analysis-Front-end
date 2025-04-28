import { TestBed } from '@angular/core/testing';

import { ToolPropertiesRightService } from './tool-properties-right.service';

describe('ToolPropertiesRightService', () => {
  let service: ToolPropertiesRightService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToolPropertiesRightService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
