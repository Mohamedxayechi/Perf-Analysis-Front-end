import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UbloadFileComponent } from './upload-file.component';

describe('UbloadFileComponent', () => {
  let component: UbloadFileComponent;
  let fixture: ComponentFixture<UbloadFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UbloadFileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UbloadFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
