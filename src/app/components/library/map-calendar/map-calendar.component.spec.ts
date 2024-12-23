import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapCalendarComponent } from './map-calendar.component';

describe('MapCalendarComponent', () => {
  let component: MapCalendarComponent;
  let fixture: ComponentFixture<MapCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
