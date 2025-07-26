import { Component, OnInit } from '@angular/core';
import { CalendarView, CalendarEvent, CalendarModule } from 'angular-calendar';
import { addDays, startOfDay, startOfWeek, endOfWeek, format } from 'date-fns';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { AppointmentService } from '../../service/appointment.service';
import { AppointmentEntity } from '../../entity/appointment';
import { AppointmentModal } from '../../shared/dialogs/appointment-dialog-modal';

@Component({
  selector: 'app-appointment',
  imports: [CommonModule, CalendarModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule],
  templateUrl: './appointment.html',
  styleUrl: './appointment.scss'
})
export class Appointment implements OnInit {
  selectedDate: Date = new Date();
  timeSlots: string[] = [];

  constructor(private router: Router, private dialog: MatDialog,
    private appointmentService: AppointmentService, private appointmentModal: AppointmentModal
  ) { }

  view: CalendarView = CalendarView.Day;
  CalendarView = CalendarView;

  viewDate: Date = new Date();

  events: CalendarEvent[] = [
    {
      start: startOfDay(addDays(new Date(), 0)),
      title: 'Sample Appointment',
      color: { primary: '#1976d2', secondary: '#D1E8FF' }
    }
  ];

  ngOnInit(): void {
    this.loadAppointmentsForDay(this.viewDate);
  }

  loadAppointmentsForDay(date: Date): void {
    const formattedDate = format(date, 'yyyy-MM-dd'); // match backend format

    this.appointmentService.getAppointmentsByDate(formattedDate).then(appointments => {
      this.events = appointments.map((appointment: AppointmentEntity) => {
        const start = new Date(`${appointment.appointmentDate}T${appointment.startTime}`);
        const end = new Date(`${appointment.appointmentDate}T${appointment.endTime}`);

        return {
          start,
          end,
          title: `Appointment: ${appointment.description}`,
          meta: { patientId: appointment.patientId, _id: appointment._id, },
          color: {
            primary: '#1976d2',
            secondary: '#e3f2fd'
          }
        };
      });
    }).catch(err => {
      console.error('Failed to load appointments:', err);
    });
  }


  setView(view: CalendarView): void {
    this.view = view;
  }

  prev(): void {
    this.viewDate = this.getAdjustedDate(-1);
    this.loadAppointmentsForDay(this.viewDate);
  }

  next(): void {
    this.viewDate = this.getAdjustedDate(1);
    this.loadAppointmentsForDay(this.viewDate);
  }

  private getAdjustedDate(direction: 1 | -1): Date {
    const incrementMap = {
      [CalendarView.Day]: 1,
      [CalendarView.Week]: 7,
      [CalendarView.Month]: 30
    };
    return addDays(this.viewDate, direction * incrementMap[this.view]);
  }

  openBookingDialog(date: Date) {
    this.openDialog(false, date);
  }


  get displayDate(): string {
    if (this.view === CalendarView.Day) {
      return format(this.viewDate, 'd MMMM'); // e.g., 27 July
    } else if (this.view === CalendarView.Week) {
      const start = startOfWeek(this.viewDate, { weekStartsOn: 1 }); // Monday
      const end = endOfWeek(this.viewDate, { weekStartsOn: 1 });     // Sunday
      return `${format(start, 'd')} - ${format(end, 'd MMMM')}`;      // e.g., 19 - 27 July
    } else if (this.view === CalendarView.Month) {
      return format(this.viewDate, 'MMMM'); // e.g., July
    }
    return '';
  }

  handleEventClicked(event: CalendarEvent): void {
    this.openDialog(true, this.viewDate, event);
  }

  openDialog(isEdit: boolean, date: Date, event?: CalendarEvent): void {

    this.appointmentModal.openAppointmentDialog({ isEdit, date, event }).then(result => {
      if (!result || !result.action)
        return;

      const { action, date, startTime, endTime, patientId, description, _id } = result;

      if (action === 'delete') {
        this.events = this.events.filter(e => e.meta._id !== _id);
        return;
      }

      if (!date || !startTime || !endTime || !patientId) {
        console.warn('Incomplete appointment data returned from dialog:', result);
        return;
      }

      const [startHour, startMinute] = startTime.split(':').map(Number);
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, startMinute);

      const [endHour, endMinute] = endTime.split(':').map(Number);
      const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, endMinute);

      const appointmentEvent: CalendarEvent = {
        start,
        end,
        title: `Appointment: ${description}`,
        meta: { patientId, _id },
        color: {
          primary: '#1976d2',
          secondary: '#e3f2fd'
        }
      };

      if (action === 'update' && isEdit && event) {
        // Replace old event with updated one
        this.events = this.events.map(e => (e === event ? appointmentEvent : e));
      } else if (action === 'create') {
        this.events = [...this.events, appointmentEvent];
      }
    });
  }


  goHome() {
    this.router.navigate(['/home']);
  }
}
