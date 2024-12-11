import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapControllersPopupComponent } from './map-controllers-popup.component';

describe('MapControllersPopupComponent', () => {
  let component: MapControllersPopupComponent;
  let fixture: ComponentFixture<MapControllersPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapControllersPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapControllersPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
