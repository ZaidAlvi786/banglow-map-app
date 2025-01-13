import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonDailogsComponent } from './common-dailogs.component';

describe('CommonDailogsComponent', () => {
  let component: CommonDailogsComponent;
  let fixture: ComponentFixture<CommonDailogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonDailogsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonDailogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
