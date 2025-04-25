import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolPropertiesRightComponent } from './tool-properties-right.component';

describe('ToolPropertiesRightComponent', () => {
  let component: ToolPropertiesRightComponent;
  let fixture: ComponentFixture<ToolPropertiesRightComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolPropertiesRightComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolPropertiesRightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
