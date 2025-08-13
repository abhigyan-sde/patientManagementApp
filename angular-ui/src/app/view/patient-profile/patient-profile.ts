import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { AppointmentService } from '../../service/appointment.service';
import { PatientService } from '../../service/patient.service';
import { Patient } from '../../entity/patient';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NotificationService } from '../../shared/dialogs/notification';
import { MatDialog } from '@angular/material/dialog';
import { AddPrescriptionDialog } from '../prescription-upload-dialog/prescription-upload-dialog';
import { MatIconModule } from '@angular/material/icon';
import { AppointmentEntity } from '../../entity/appointment';
import { ConfirmDialog } from '../../shared/dialogs/confirm-dialog/confirm-dialog';
import { RescheduleAppointmentDialog } from '../appointment/reschedule-appointment/reschedule-appointment';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter, MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-patient-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    RouterModule,
    MatIconModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './patient-profile.html',
  styleUrl: './patient-profile.scss'
})
export class PatientProfile implements OnInit {
  patientForm!: FormGroup;
  appointments: any[] = [];
  prescriptions: { date: string, images: { preview: string, path: string }[] }[] = [];
  isEditable = false;
  patientId!: any;
  lightboxOpen = false;
  currentImage = '';
  currentIndex = 0;
  lightboxImages: string[] = [];
  selectedDate: Date | null = null;
  allPrescriptions: { date: string, images: { preview: string, path: string }[] }[] = [];

  private originalData: Partial<Patient> = {};

  private patientSchema: (keyof Patient)[] = [
    'firstName',
    'lastName',
    'contactNumber',
    'email',
    'firstVisitDate',
    'recentVisitDate'
  ];

  constructor(private fb: FormBuilder,
    private router: Router,
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private route: ActivatedRoute,
    private notification: NotificationService,
    private dialog: MatDialog) {
    this.patientForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      contactNumber: ['', Validators.required],
      email: [''],
      firstVisitDate: ['', Validators.required],
      recentVisitDate: ['', Validators.required],
      nextVisitDate: ['']
    });
    const paramMap = toSignal(this.route.paramMap);
    this.patientId = computed(() => paramMap()?.get('id') ?? '');
  }

  ngOnInit(): void {
    if (this.patientId) {
      this.loadPatient(this.patientId());
      this.loadAppointments(this.patientId());
    }
  }


  async loadPatient(id: string): Promise<void> {
    try {
      const patient = await this.patientService.getPatientById(id);
      this.originalData = { ...patient };

      console.log('Patient data:', this.originalData);

      this.patientForm = this.fb.group({
        firstName: [patient.firstName],
        lastName: [patient.lastName],
        contactNumber: [patient.contactNumber],
        email: [patient.email || ''],
        firstVisitDate: [patient.firstVisitDate],
        recentVisitDate: [patient.recentVisitDate],
      });

      this.patientForm.disable();
      this.isEditable = false;

      const prescriptionsMap = patient.prescriptions as Record<string, string> || {};
      const prescriptions = await Promise.all(Object.entries(prescriptionsMap).map(async ([date, folderPath]) => {
        const images = await this.patientService.loadImageFolderBase64(folderPath); // returns preview + path
        const localDate = new Date(date);
        const localDateOnly = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate())
        .toISOString();
        return { date: localDateOnly, images };
      }));

      this.allPrescriptions = prescriptions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      this.prescriptions = [...this.allPrescriptions];
    } catch (error) {
      console.error('Failed to load patient:', error);
      this.notification.showError('Failed to load patient details');
    }
  }

  filterPrescriptions(): void {
    if (!this.selectedDate) {
      this.prescriptions = [...this.allPrescriptions];
      return;
    }

    const selected = new Date(this.selectedDate).toISOString().split('T')[0];

    this.prescriptions = this.allPrescriptions.filter(pres => {
      const presDate = new Date(pres.date).toISOString().split('T')[0];
      return presDate === selected;
    });
  }


  loadAppointments(patientId: string): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.appointmentService.getAppointmentsByPatientId(patientId).then(appts => {
      this.appointments = appts
        .map(a => ({
          ...a, //Copy all other properties
          // safe local‑midnight date
          localDate: (() => {
            const [y, m, d] = a.appointmentDate.split('-').map(Number);
            return new Date(y, m - 1, d);       // month is 0‑based
          })()
        }))
        .filter(a => a.localDate >= today)
        .sort((a, b) => a.localDate.getTime() - b.localDate.getTime());
    });
  }

  async deletePrescriptionImageOrFolder(date: string, imageToDelete: string | undefined = undefined): Promise<void> {
    const confirmDelete = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete prescription?'
      },
      width: '300px'
    });

    confirmDelete.afterClosed().subscribe(confirmed => {
      if (confirmed && imageToDelete) {
        this.deletePrescriptionImage(date, imageToDelete);
      } else if (confirmed) {
        this.deletePrescription(date);
      }
    });
  }

  async deletePrescription(date: string): Promise<void> {
    const folderPath = this.originalData.prescriptions?.[date];
    if (!folderPath)
      return;
    try {
      // Step 1: Delete the folder from disk
      await this.patientService.deletePrescriptionFolder(folderPath);

      // Step 2: Remove the entry from prescription map
      const updatedPrescriptions = { ...this.originalData.prescriptions };
      delete updatedPrescriptions[date];

      // Step 3: Update the patient document
      const updatePayload: any = { id: this.patientId(), prescriptions: updatedPrescriptions };
      await this.patientService.updatePatient(updatePayload);

      // Step 4: Update UI and local copy
      this.originalData.prescriptions = updatedPrescriptions;
      this.prescriptions = this.prescriptions.filter(p => p.date !== date);
      this.notification.showSuccess('Prescription deleted successfully');
    } catch (error: any) {
      console.log(error);
      this.notification.showError('Error deleting prescription : ' + error.message);
    }
  }

  async deletePrescriptionImage(date: string, imageToDelete: string): Promise<void> {
    const folderPath = this.originalData.prescriptions?.[date];
    if (!folderPath) return;

    try {
      // Delete the single image file from disk
      await this.patientService.deletePrescriptionFile(imageToDelete);

      // Update the images list in UI and local copy
      this.prescriptions = this.prescriptions.map(prescription => {
        if (prescription.date === date) {
          return {
            date: prescription.date,
            images: prescription.images.filter(img => img.path !== imageToDelete)
          };
        }
        return prescription;
      });

      // Check if any images remain for this date
      const updatedImages = this.prescriptions.find(p => p.date === date)?.images || [];

      if (updatedImages.length === 0) {
        // No images left - reuse deletePrescription to remove entire folder and update patient
        await this.deletePrescription(date);
      } else {
        // Images remain - update patient with unchanged folderPath
        const updatedPrescriptions = {
          ...this.originalData.prescriptions,
          [date]: folderPath
        };

        const updatePayload: any = { _id: this.patientId(), prescriptions: updatedPrescriptions };
        await this.patientService.updatePatient(updatePayload);

        // Update local copy
        this.originalData.prescriptions = updatedPrescriptions;
      }

      this.notification.showSuccess('Prescription image deleted successfully');
    } catch (error: any) {
      console.error(error);
      this.notification.showError('Error deleting prescription image: ' + error.message);
    }
  }

  openAddPrescriptionDialog(): void {
    const dialogRef = this.dialog.open(AddPrescriptionDialog, { width: '400px' })
    dialogRef.afterClosed().subscribe((files: File[] | undefined) => {
      if (files?.length) {
        this.addPrescription(files);
      }
    });
  }


  async addPrescription(files: File[]): Promise<void> {
    if (!files?.length) return;

    let folderPath: string | undefined;
    try {
      const date = new Date().toISOString();
      const folderTimestamp = date.replace(/[:.]/g, '-');
      folderPath = await this.patientService.savePrescriptionFile(files, folderTimestamp);

      const updatePayload: any = {
        _id: this.patientId(),
        prescriptions: { ...this.originalData.prescriptions, [date]: folderPath }
      };

      await this.patientService.updatePatient(updatePayload);

      const images = await this.patientService.loadImageFolderBase64(folderPath);
      this.prescriptions.unshift({ date, images });
      this.originalData.prescriptions = { ...updatePayload.prescriptions };

      this.notification.showSuccess('Added prescription');
    } catch (error: any) {
      console.error('Add prescription failed:', error.message);
      if (folderPath) await this.patientService.deletePrescriptionFolder(folderPath);
      this.notification.showError('Failed to add prescription: ' + error.message);
    }
  }

  async save(): Promise<void> {
    try {
      if (this.patientForm.valid) {
        const formValue = this.patientForm.value;
        const updatePayload: any = { _id: this.patientId() };

        this.patientSchema.forEach(field => {
          if (field in formValue && formValue[field] !== this.originalData[field]) {
            updatePayload[field] = formValue[field];
          }
        });

        if (Object.keys(updatePayload).length > 1) {
          await this.patientService.updatePatient(updatePayload);
          this.loadPatient(this.patientId());
          this.loadAppointments(this.patientId());
          this.notification.showSuccess('Patient updated successfully');
        } else {
          console.log('Nothing changed to update.');
        }
      }
    } catch (error: any) {
      console.error('Error in updating patient : ' + error.message);
      this.notification.showError('Error in updating patient : ' + error.message);
    }
  }

  toggleEdit(): void {
    this.isEditable = !this.isEditable;
    if (this.isEditable)
      this.patientForm.enable();
    else
      this.patientForm.disable();
  }

  goBack() {
    this.router.navigate(['/view-patients']);
  }

  openLightbox(images: string[], index: number): void {
    this.lightboxImages = images;
    this.currentIndex = index;
    this.currentImage = images[index];
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    this.lightboxImages = [];
    this.currentImage = '';
  }

  previousImage(): void {
    if (this.lightboxImages.length) {
      this.currentIndex = (this.currentIndex - 1 + this.lightboxImages.length) % this.lightboxImages.length;
      this.currentImage = this.lightboxImages[this.currentIndex];
    }
  }

  nextImage(): void {
    if (this.lightboxImages.length) {
      this.currentIndex = (this.currentIndex + 1) % this.lightboxImages.length;
      this.currentImage = this.lightboxImages[this.currentIndex];
    }
  }

  getPreviewImages(images: { preview: string, path: string }[]): string[] {
    return images.map(img => img.preview);
  }

  onEditAppointment(appt: AppointmentEntity): void {
    const originalStart = new Date(`${appt.appointmentDate}T${appt.startTime}`);
    const originalEnd = new Date(`${appt.appointmentDate}T${appt.endTime}`);

    const dialogRef = this.dialog.open(RescheduleAppointmentDialog, {
      width: '400px',
      data: {
        _id: appt._id,
        description: appt.description,
        selectedDate: originalStart,
        startTime: appt.startTime,
        endTime: appt.endTime
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      const { selectedDate, startTime, endTime, description } = result;

      const updatedAppointment: AppointmentEntity = {
        _id: appt._id,
        patientId: appt.patientId,
        description,
        appointmentDate: selectedDate.toISOString().split('T')[0],
        startTime,
        endTime
      };

      this.appointmentService.updateAppointment(updatedAppointment)
        .then(() => this.loadAppointments(appt.patientId))
        .catch(err => {
          console.error("Error updating appointment:", err);
          this.notification.showError(err);
        });
    });
  }


  onDeleteAppointment(appt: AppointmentEntity): void {
    const confirmDelete = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete this appointment?'
      },
      width: '300px'
    });

    confirmDelete.afterClosed().subscribe(confirmed => {
      if (confirmed && appt._id) {
        this.appointmentService.deleteAppointment(appt._id).then(() => {
          this.loadAppointments(appt.patientId); // refresh after deletion
        }).catch(error => {
          console.error('Error occurred while deleting appointment : ' + error);
        });
      }
    });
  }
}
