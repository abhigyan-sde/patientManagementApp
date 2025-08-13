import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PatientService } from '../../service/patient.service';
import { NotificationService } from '../../shared/dialogs/notification';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AppointmentService } from '../../service/appointment.service';

@Component({
  selector: 'app-view-patient',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './view-patient.html',
  styleUrls: ['./view-patient.scss']
})
export class ViewPatient implements OnInit {
  patients: any[] = [];
  searchTerm = '';
  currentPage = 0; // zero-based
  pageSize = 10;
  totalPatients = 0;

  constructor(
    private router: Router,
    private patientService: PatientService,
    private notification: NotificationService,
    private appointmentService: AppointmentService
  ) { }

  ngOnInit() {
    this.loadPatients();
  }

  // Load patients with server-side pagination & filtering
  async loadPatients() {
    try {
      const data = await this.patientService.getAllPatients(this.currentPage, this.pageSize, this.searchTerm);
      this.patients = data.patients;
      this.totalPatients = data.total;
    } catch (err) {
      console.error('Error loading patients', err);
      this.notification.showError('Error loading patients data');
    }
  }

  // Triggered when search term changes (input event)
  onSearchTermChange(event: Event) {
    const input = event.target as HTMLInputElement | null;
    if (input) {
      this.searchTerm = input.value.trim();
      this.currentPage = 0;
      this.loadPatients();
    }
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadPatients();
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadPatients();
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadPatients();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalPatients / this.pageSize);
  }

  viewPatient(id: string) {
    this.router.navigate(['/patient', id]);
  }

  async deletePatient(id: string) {
    if (confirm('Are you sure you want to delete this patient record?')) {
      try {
        var patient = await this.patientService.getPatientById(id);
        //Delete associated prescriptions
        for(let folderPath of Object.values(patient.prescriptions)){
          await this.patientService.deletePrescriptionFolder(folderPath);
        }
        //Fetch associated appointments
        var appts = await this.appointmentService.getAppointmentsByPatientId(id);
        //Delete associated appointments
        for(const appt of appts){
          if(appt?._id)
            await this.appointmentService.deleteAppointment(appt._id);
        }
        await this.patientService.deletePatient(id);
        this.notification.showSuccess('Patient deleted');
        this.loadPatients();
      } catch (err) {
        console.error('Error deleting patient', err);
        this.notification.showError('Failed to delete patient');
      }
    }
  }
}
