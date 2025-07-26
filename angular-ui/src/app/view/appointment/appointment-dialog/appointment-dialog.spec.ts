import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentDialog } from './appointment-dialog';

describe('AppointmentDialog', () => {
  let component: AppointmentDialog;
  let fixture: ComponentFixture<AppointmentDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
