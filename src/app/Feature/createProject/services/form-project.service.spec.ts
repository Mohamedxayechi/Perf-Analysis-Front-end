import { TestBed } from '@angular/core/testing';

import { FormProjectService } from './form-project.service';

describe('FormProjectService', () => {
  let service: FormProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
