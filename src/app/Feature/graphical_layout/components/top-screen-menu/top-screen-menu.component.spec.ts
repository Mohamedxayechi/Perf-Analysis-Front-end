import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopScreenMenuComponent } from './top-screen-menu.component';

describe('TopScreenMenuComponent', () => {
  let component: TopScreenMenuComponent;
  let fixture: ComponentFixture<TopScreenMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopScreenMenuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TopScreenMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
