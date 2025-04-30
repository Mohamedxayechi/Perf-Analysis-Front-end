import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertiesBarComponent } from './properties-bar.component';

describe('PropertiesBarComponent', () => {
  let component: PropertiesBarComponent;
  let fixture: ComponentFixture<PropertiesBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertiesBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertiesBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
