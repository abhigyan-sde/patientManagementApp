import { Component, Inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { AppointmentEntity } from '../../../entity/appointment';
import { AppointmentService } from '../../../service/appointment.service';
import { PatientService } from '../../../service/patient.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Patient } from '../../../entity/patient';
import { MatSelectModule } from '@angular/material/select';
import { ConfirmDialog } from '../../../shared/dialogs/confirm-dialog/confirm-dialog';
import { generateTimeSlots, getAvailableTimeSlots } from '../../../shared/utils/calendarUtils';


@Component({
  selector: 'app-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './appointment-dialog.html',
  styleUrl: './appointment-dialog.scss'
})
export class AppointmentDialog implements OnInit {
  appointmentForm: FormGroup;
  date: Date;
  timeSlots: string[] = [];
  availableStartTimes = signal<string[]>([]);
  availableEndTimes = signal<string[]>([]);
  timeIntervalMinutes = 20;
  filteredPatients: Patient[] = [];
  patientSearchControl = new FormControl<Patient | string>('');
  currentPage = 0;
  pageSize = 20;
  hasMore = true;
  isLoading = false;
  currentFilter: string | undefined;
  isEditMode = false;
  isExistingAppointment = false;
  existingAppointmentId?: string;
  private startTimeChangedByUser = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AppointmentDialog>,
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: {
      time: string;
      date: Date,
      patientId?: string;
      description?: string;
      startTime?: string;
      endTime?: string;
      _id?: string;
    }
  ) {
    this.date = data.date;
    this.timeSlots = generateTimeSlots();
    this.currentFilter = '';
    let defaultStart = data.startTime;
    if (!defaultStart && data.date) {
      const hours = data.date.getHours().toString().padStart(2, '0');
      const minutes = data.date.getMinutes().toString().padStart(2, '0');
      defaultStart = `${hours}:${minutes}`;
    }
    defaultStart = defaultStart || this.timeSlots[0];
    const defaultEnd = data.endTime || this.getDefaultEndTime(defaultStart);
    this.existingAppointmentId = data._id;
    this.isExistingAppointment = !!data._id;
    this.isEditMode = !this.isExistingAppointment;
    this.appointmentForm = this.fb.group({
      patientId: [data.patientId || '', Validators.required],
      description: [data.description || ''],
      startTime: [defaultStart, Validators.required],
      endTime: [defaultEnd, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadPatients('');
    this.startTimeChangedByUser = false;

    if (this.isExistingAppointment) {
      this.appointmentForm.disable();
      this.patientSearchControl.disable();
    }

    this.patientSearchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.currentFilter = typeof value === 'string' ? value : '';
      this.loadPatients(this.currentFilter, true); // reset
    });

    this.patientSearchControl.valueChanges.subscribe(selected => {
      if (typeof selected === 'object' && selected?._id) {
        this.appointmentForm.get('patientId')?.setValue(selected._id);
      }
    });

    if (this.data.patientId) {
      this.patientService.getPatientById(this.data.patientId).then(patient => {
        const newPatients = patient || [];
        this.filteredPatients = [newPatients, ...this.filteredPatients];
        this.patientSearchControl.setValue(patient.firstName + " " + patient.lastName);
      });
    }

    const startControl = this.appointmentForm.get('startTime');
    const endControl = this.appointmentForm.get('endTime');

    if (startControl && endControl) {
      this.fetchAvailableTimeSlots();
      startControl.valueChanges.subscribe(start => {
        this.startTimeChangedByUser = true;
        this.updateEndTimes(start);

        // only reset endTime if user has actively changed startTime
        const currentEndTime = this.appointmentForm.get('endTime')?.value;
        const newDefaultEnd = this.getDefaultEndTime(start);

        // Only update if current endTime is invalid for the new startTime
        if (!this.availableEndTimes().includes(currentEndTime)) {
          endControl.setValue(newDefaultEnd, { emitEvent: false });
        }
      });

    }
  }

  private async fetchAvailableTimeSlots() {
    const start = this.appointmentForm.get('startTime')?.value;
    const end = this.appointmentForm.get('endTime')?.value;

    const { availableStartTimes } = await getAvailableTimeSlots(
      this.appointmentService,
      this.date,
      this.timeSlots,
      this.existingAppointmentId
    );

    this.availableStartTimes.set(availableStartTimes);

    const isStartValid = availableStartTimes.includes(start);

    if (!isStartValid) {
      const defaultStart = availableStartTimes[0];
      const defaultEnd = this.getDefaultEndTime(defaultStart);
      this.appointmentForm.patchValue({
        startTime: defaultStart,
        endTime: defaultEnd
      }, { emitEvent: false });
      this.updateEndTimes(defaultStart);
    } else {
      // Keep the existing values and update end time list accordingly
      this.updateEndTimes(start);
    }
  }


  loadPatients(filter: string | undefined, reset: boolean = false) {
    if (this.isLoading || (!this.hasMore && !reset)) return;

    if (reset) {
      this.filteredPatients = [];
      this.currentPage = 0;
      this.hasMore = true;
    }

    this.isLoading = true;
    this.patientService.getAllPatients(this.currentPage, this.pageSize, filter).then(data => {
      const newPatients = data.patients || [];
      this.filteredPatients = [...this.filteredPatients, ...newPatients];
      this.hasMore = newPatients.length === this.pageSize; // if less, no more data
      this.currentPage++;
    }).finally(() => {
      this.isLoading = false;
    });
  }

  displayPatient(patient: Patient | string): string {
    if (!patient) return '';
    if (typeof patient === 'string') return patient;
    return `${patient.firstName} ${patient.lastName}`;
  }

  updateEndTimes(start: string): void {
    const startIndex = this.timeSlots.indexOf(start);
    this.availableEndTimes.set(this.timeSlots.slice(startIndex + 1));
  }

  getDefaultEndTime(start: string): string {
    const index = this.timeSlots.indexOf(start);
    return this.timeSlots[index + 1] || this.timeSlots[index];
  }

  async submit(): Promise<void> {
    if (this.appointmentForm.valid) {
      const { patientId, description, startTime, endTime } = this.appointmentForm.value;
      const appointmentDate = [
        this.date.getFullYear(),
        String(this.date.getMonth() + 1).padStart(2, '0'),
        String(this.date.getDate()).padStart(2, '0')
      ].join('-');

      let appointment: AppointmentEntity = {
        patientId,
        description,
        appointmentDate,
        startTime,
        endTime,
      };

      try {
        let appointmentId = this.existingAppointmentId;
        if (this.isEditMode && this.existingAppointmentId) {
          appointment._id = this.existingAppointmentId;
          await this.appointmentService.updateAppointment(appointment);
        } else {
          appointmentId = await this.appointmentService.addAppointment(appointment);
        }

        this.dialogRef.close({
          action: this.isExistingAppointment ? 'update' : 'create',
          _id: appointmentId,
          date: this.date,
          startTime,
          endTime,
          patientId,
          description
        });
      } catch (err) {
        console.error('Error saving appointment:', err);
        this.dialogRef.close(false);
      }
    }
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  delete(): void {
    const confirmDelete = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete this appointment?'
      },
      width: '300px'
    });

    confirmDelete.afterClosed().subscribe(confirmed => {
      if (confirmed && this.data?._id) {
        this.appointmentService.deleteAppointment(this.data._id).then(() => {
          this.dialogRef.close({ action: 'delete', _id: this.data._id });
        }).catch(error => {
          console.error('Error deleting appointment : ' + error);
          this.dialogRef.close(false);
        });
      }
    })
  }

  enableEdit(): void {
    this.isEditMode = true;
    this.appointmentForm.enable();
    this.patientSearchControl.enable();
  }
}
