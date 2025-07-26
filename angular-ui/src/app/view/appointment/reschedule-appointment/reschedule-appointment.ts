import { Component, Inject, OnInit } from "@angular/core";
import { generateTimeSlots, getAvailableTimeSlots } from '../../../shared/utils/calendarUtils';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { AppointmentService } from "../../../service/appointment.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FormsModule } from "@angular/forms";
import { provideNativeDateAdapter } from '@angular/material/core';
import { CommonModule } from "@angular/common";

@Component({
    selector: 'reschedule-appointment',
    templateUrl: 'reschedule-appointment.html',
    styleUrl: 'reschedule-appointment.scss',
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatSelectModule,
        MatDatepickerModule,
        FormsModule,
        CommonModule,
        MatDialogModule,
    ],
    providers: [provideNativeDateAdapter()],
})
export class RescheduleAppointmentDialog implements OnInit {
    selectedDate: Date;
    availableStartTimes: string[] = [];
    availableEndTimes: string[] = [];
    startTime: string | undefined;
    endTime: string | undefined;
    description: string | undefined;
    private timeSlots = generateTimeSlots();

    ngOnInit(): void {
        this.fetchAvailableTimes(true);
    }

    constructor(
        private dialogRef: MatDialogRef<RescheduleAppointmentDialog>,
        private appointmentService: AppointmentService,
        @Inject(MAT_DIALOG_DATA) public data: {
            _id: string;
            selectedDate: string;
            startTime: string;
            endTime: string;
            description: string;
        }
    ) {
        this.selectedDate = new Date(data.selectedDate);
        this.startTime = data.startTime;
        this.endTime = data.endTime;
        this.description = data.description;
    }

    async fetchAvailableTimes(skipEndTimeUpdate = false): Promise<void> {
        const result = await getAvailableTimeSlots(
            this.appointmentService,
            this.selectedDate,
            this.timeSlots,
            this.data._id,
            this.startTime
        );

        this.availableStartTimes = result.availableStartTimes;
        this.startTime = result.updatedStartTime;
        if (!skipEndTimeUpdate) {
            this.endTime = result.updatedEndTime;
        }

        this.updateEndTimes();
    }

    updateEndTimes(): void {
        if (!this.startTime) return;
        const index = this.timeSlots.indexOf(this.startTime);
        this.availableEndTimes = this.timeSlots.slice(index + 1);

        // If the previously set endTime is still valid, preserve it
        if (!this.availableEndTimes.includes(this.endTime || "")) {
            this.endTime = this.availableEndTimes[0];
        }
    }

    cancel(): void {
        this.dialogRef.close(null);
    }

    save(): void {
        if (this.startTime && this.endTime) {
            this.dialogRef.close({
                selectedDate: this.selectedDate,
                startTime: this.startTime,
                endTime: this.endTime,
                description: this.description
            });
        }
    }

}