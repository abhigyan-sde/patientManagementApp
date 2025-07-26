import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PatientService } from '../../service/patient.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Patient } from '../../entity/patient';
import { debounceTime, distinctUntilChanged, delay } from 'rxjs/operators';
import { AddPrescriptionDialog } from '../prescription-upload-dialog/prescription-upload-dialog';
import { NotificationService } from '../../shared/dialogs/notification';

@Component({
  selector: 'app-prescription-upload',
  imports: [CommonModule, ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule,
    ReactiveFormsModule],
  templateUrl: './prescription-upload.html',
  styleUrl: './prescription-upload.scss'
})
export class PrescriptionUpload implements OnInit {
  uploadForm!: FormGroup;
  patients: any[] = []; // Replace with actual patient fetching
  selectedFiles: File[] = [];
  fileNames: string[] = [];
  patientSearchControl = new FormControl<Patient | string>('');
  uploadInProgress = false;
  uploadProgress = 0;
  filteredPatients: Patient[] = [];
  hasMore = true;
  isLoading = false;
  currentPage = 0;
  pageSize = 20;
  currentFilter: string | undefined;
  projectedFields: string[] = ['firstName', 'lastName', 'prescriptions'];

  constructor(private fb: FormBuilder, private dialog: MatDialog,
    private router: Router, private patientService: PatientService,
    private notification: NotificationService) { }

  ngOnInit(): void {
    this.uploadForm = this.fb.group({
      patientId: ['', Validators.required]
    });

    // Load patients here
    this.loadPatients('');

    this.patientSearchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.currentFilter = typeof value === 'string' ? value : '';
      this.loadPatients(this.currentFilter, true); // reset
    });

    this.patientSearchControl.valueChanges.subscribe(selected => {
      if (typeof selected === 'object' && selected?._id) {
        this.uploadForm.get('patientId')?.setValue(selected._id);
      }
    });
  }

  loadPatients(filter: string | undefined, reset: boolean = false) {
    if (this.isLoading || (!this.hasMore && !reset))
      return;

    if (reset) {
      this.filteredPatients = [];
      this.currentPage = 0;
      this.hasMore = true;
    }

    this.isLoading = true;
    this.patientService.getAllPatients(this.currentPage, this.pageSize, filter, this.projectedFields).then(data => {
      const newPatients = data.result.patients || [];
      this.filteredPatients = [...this.filteredPatients, ...newPatients];
      this.hasMore = newPatients.length === this.pageSize; // if less, no more data
      this.currentPage++;
    }).finally(() => {
      this.isLoading = false;
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    this.selectedFiles = Array.from(input.files);
    this.fileNames = this.selectedFiles.map(f => f.name);
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
    if (!files || files.length === 0)
      return;

    this.uploadInProgress = true;
    this.uploadProgress = 0;

    let folderPath: string | undefined;
    try {
      const date = new Date().toISOString();
      const folderTimestamp = date.replace(/[:.]/g, '-');
      const patientId = this.uploadForm.get('patientId')?.value;
      const selectedPatient = this.filteredPatients.find(p => p._id === patientId);
      const existingPrescriptions = selectedPatient?.prescriptions || {};

      this.uploadProgress = 20;
      delay(300);

      folderPath = await this.patientService.savePrescriptionFile(files, folderTimestamp);

      this.uploadProgress = 50;
      delay(300);

      const updatePayload: any = {
        id: patientId,
        prescriptions: {
          ...existingPrescriptions,
          [date]: folderPath
        }
      };
      await this.patientService.updatePatient(updatePayload);
      this.uploadProgress = 80;
      delay(200);

      this.uploadProgress = 100;
      this.uploadInProgress = false;
      this.uploadForm.reset();
      this.selectedFiles = [];
      this.fileNames = [];
      this.notification.showSuccess('Added prescription');
    } catch (error: any) {
      console.error('Add prescription failed:', error.message);
      if (folderPath)
        await this.patientService.deletePrescriptionFolder(folderPath);
      this.notification.showError('Failed to add prescription : ' + error.message);
    }
  }

  displayPatient(patient: Patient | string): string {
    if (!patient)
      return '';

    else if (typeof patient === 'string')
      return patient;

    return `${patient.firstName} ${patient.lastName}`;
  }

  cancel() {
    this.router.navigate(['/home']);
  }

}
