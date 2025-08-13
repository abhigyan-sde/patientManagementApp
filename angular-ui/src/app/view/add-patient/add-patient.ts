import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PatientService } from '../../service/patient.service';
import { Patient } from '../../entity/patient';
import { NotificationService } from '../../shared/dialogs/notification';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-add-patient',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatFormFieldModule, MatInputModule,
     MatDatepickerModule, MatNativeDateModule, MatButtonModule],
  templateUrl: './add-patient.html',
  styleUrl: './add-patient.scss'
})
export class AddPatient {
  patientForm: FormGroup;
  prescriptionFiles: File[] = [];

  constructor(private fb: FormBuilder, private router: Router,
    private patientService: PatientService,
    private notification: NotificationService) {
    const today = new Date().toISOString().substring(0, 10); // yyyy-MM-dd format for input[type=date]

    this.patientForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      contactNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', Validators.email],
      firstVisitDate: [today, Validators.required],
      recentVisitDate: [today, Validators.required],
      prescriptions: [''] // for file input, not reactive validator
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.prescriptionFiles = Array.from(input.files);
    }
  }

  invalid(field: string): boolean {
    const control = this.patientForm.get(field);
    return control?.touched && control?.invalid || false;
  }

  cancel() {
    this.router.navigate(['/home']);
  }

  async submit() {
    if (this.patientForm.valid) {
      const formValue = this.patientForm.value;
      try {
        // Prepare prescription map
        const prescriptions: Record<string, string> = {};
        if (this.prescriptionFiles?.length > 0) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // used for folder name
          const folderPath = await this.patientService.savePrescriptionFile(this.prescriptionFiles, timestamp);
          const dateTime = new Date().toISOString();
          prescriptions[dateTime] = folderPath;
        }

        // Construct patient object
        const patient: Patient = {
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          contactNumber: formValue.contactNumber,
          email: formValue.email,
          firstVisitDate: formValue.firstVisitDate,
          recentVisitDate: formValue.recentVisitDate,
          prescriptions: prescriptions
        };
        const patientId = await this.patientService.addPatient(patient);
        this.notification.showSuccess('Patient added successful');
        this.router.navigate([`/patient/${patientId}`]);
      } catch (err : any) {
        this.notification.showError('Failed to save patient, error msg : ' + err.message + '| detailed error - ' + err.originalError);
      }
    } else {
      this.patientForm.markAllAsTouched();
    }
  }
}
