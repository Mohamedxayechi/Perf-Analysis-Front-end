import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolGraphicalLeftComponent } from './tool-graphical-left.component';

describe('ToolGraphicalLeftComponent', () => {
  let component: ToolGraphicalLeftComponent;
  let fixture: ComponentFixture<ToolGraphicalLeftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolGraphicalLeftComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolGraphicalLeftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
