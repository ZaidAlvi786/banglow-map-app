import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatepickerDailogComponent } from './datepicker-dailog.component';

describe('DatepickerDailogComponent', () => {
  let component: DatepickerDailogComponent;
  let fixture: ComponentFixture<DatepickerDailogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatepickerDailogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DatepickerDailogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
