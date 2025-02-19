import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageryStatusComponent } from './imagery-status.component';

describe('ImageryStatusComponent', () => {
  let component: ImageryStatusComponent;
  let fixture: ComponentFixture<ImageryStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageryStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageryStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
