import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppointmentEntity } from '../../entity/appointment';
import { AppointmentService } from '../../service/appointment.service';
import { PatientService } from '../../service/patient.service';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import {MatTooltipModule} from '@angular/material/tooltip';

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule, MatTableModule, MatTooltipModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {
  allAppointments: AppointmentEntity[] = []
  displayedColumns: string[] = ['time', 'name', 'description'];
  upcomingAppointments: {
    startTime: string;
    endTime: string;
    description: string;
    patientName: string;
  }[] = [];
  private refreshSub?: Subscription;

  constructor(
    private appointmentService: AppointmentService,
    private patientService: PatientService
  ) { }
  async ngOnInit(): Promise<void> {
    this.upcomingAppointments = [
      {
        startTime: '10:00',
        endTime: '10:20',
        description: 'Routine check-up and surgery and lot of issues to fix. Followed by lot of drugs.',
        patientName: 'Alice Johnson'
      },
      {
        startTime: '10:30',
        endTime: '10:50',
        description: 'Follow-up for blood test',
        patientName: 'Bob Smith'
      },
      {
        startTime: '11:00',
        endTime: '11:20',
        description: 'Consultation for back pain',
        patientName: 'Carla Patel'
      },
      {
        startTime: '11:30',
        endTime: '11:50',
        description: 'General health discussion',
        patientName: 'Daniel Garcia'
      },      
      {
        startTime: '10:00',
        endTime: '10:20',
        description: 'Routine check-up and surgery and lot of issues to fix. Followed by lot of drugs.',
        patientName: 'Alice Jaine'
      },
      {
        startTime: '10:00',
        endTime: '10:20',
        description: 'Routine check-up and surgery and lot of issues to fix. Followed by lot of drugs.',
        patientName: 'Abhigyan Johnson'
      },
           {
        startTime: '11:30',
        endTime: '11:50',
        description: 'General health discussion',
        patientName: 'Daniel Garcia'
      },      
      {
        startTime: '10:00',
        endTime: '10:20',
        description: 'Routine check-up and surgery and lot of issues to fix. Followed by lot of drugs.',
        patientName: 'Alice Jaine'
      },
    ];

    //this.loadUpcomingAppointments();
    //this.refreshSub = interval(60_000).subscribe(() => this.loadUpcomingAppointments());
  }

  /**
     * Fetch today's appointments, filter those starting within the next 60 minutes,
     * and enrich them with patient names.
     */
  private async loadUpcomingAppointments(): Promise<void> {
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const dateKey = now.toISOString().split('T')[0];              // 'YYYY-MM-DD'

    // 1. get today's appointments
    const appointments = await this.appointmentService.getAppointmentsByDate(dateKey);

    // 2. map + filter upcoming appointments for the next hour
    const upcoming = [];
    for (const appt of appointments as AppointmentEntity[]) {
      const [hour, minute] = appt.startTime.split(':').map(Number);
      const start = new Date(dateKey);
      start.setHours(hour, minute, 0, 0);

      if (start >= now && start <= inOneHour) {
        const pat = await this.patientService.getPatientById(appt.patientId);
        upcoming.push({
          startTime: appt.startTime,
          endTime: appt.endTime,
          description: appt.description ?? '',
          patientName: `${pat.firstName} ${pat.lastName}`
        });
      }
    }
    this.upcomingAppointments = upcoming;
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

}
