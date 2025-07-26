import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { CalendarEvent } from "angular-calendar";
import { format } from "date-fns";
import { AppointmentDialog } from "../../view/appointment/appointment-dialog/appointment-dialog";


export interface AppointmentDialogInput {
    isEdit: boolean;
    date: Date;
    event?: CalendarEvent
}

export interface AppointmentDialogResult {
    action: 'create' | 'update' | 'delete';
    _id?: string;
    patientId: string;
    description: string;
    date: Date;
    startTime: string;
    endTime: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentModal {

    constructor(private dialog: MatDialog) { }

    openAppointmentDialog(appt: AppointmentDialogInput): Promise<AppointmentDialogResult | null> {
        const { isEdit, date, event } = appt;

        const dialogData = isEdit && event ? {
            isEdit: true,
            _id: event.meta._id,
            patientId: event.meta.patientId,
            description: event.title.replace('Appointment: ', ''),
            date: new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate()),
            startTime: new Date(event.start).toTimeString().slice(0, 5),
            endTime: new Date(event.end ?? event.start).toTimeString().slice(0, 5)
        } : {
            isEdit: false,
            date,
            time: format(date, 'HH:mm')
        }

        const dialogRef = this.dialog.open(AppointmentDialog, {
            width: '400px',
            data: dialogData
        });

        return dialogRef.afterClosed().toPromise();
    }
}