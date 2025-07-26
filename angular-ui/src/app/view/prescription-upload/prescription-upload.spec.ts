import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionUpload } from './prescription-upload';

describe('PrescriptionUpload', () => {
  let component: PrescriptionUpload;
  let fixture: ComponentFixture<PrescriptionUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrescriptionUpload]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrescriptionUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
