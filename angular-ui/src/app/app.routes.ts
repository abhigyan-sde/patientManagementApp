import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout';
import { Home } from './view/home/home';
import { ViewPatient } from './view/view-patient/view-patient';
import { AddPatient } from './view/add-patient/add-patient';
import { PatientProfile } from './view/patient-profile/patient-profile';
import { Appointment } from './view/appointment/appointment';
import { PrescriptionUpload } from './view/prescription-upload/prescription-upload';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Home },
      { path: 'view-patients', component: ViewPatient },
      { path: 'add-patient', component: AddPatient },
      { path: 'patient/:id', component: PatientProfile },
      { path: 'appointments', component: Appointment },
      { path: 'prescriptions', component: PrescriptionUpload }
    ]
  }
];
