import { AppointmentService } from "../../service/appointment.service";

export function generateTimeSlots(startHour = 8, endHour = 21, intervalMinutes = 20): string[] {
  const slots: string[] = [];

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }

  return slots;
}

export async function getAvailableTimeSlots(appointmentService: AppointmentService,
  selectedDate: Date,
  timeSlots: string[],
  excludedAppointmentId?: string,
  currentStartTime?: string): Promise<{
    availableStartTimes: string[];
    updatedStartTime?: string;
    updatedEndTime?: string;
  }> {
  const dateString = selectedDate.toISOString().split('T')[0];

  const appts = await appointmentService.getAppointmentsByDate(dateString);

  const takenSlots = appts
    .filter(a => a._id !== excludedAppointmentId)
    .map(a => `${a.startTime}-${a.endTime}`);

  const availableStartTimes = timeSlots.filter(time =>
    !takenSlots.some(slot => {
      const [s, e] = slot.split('-');
      return time >= s && time < e;
    })
  );

  if (!currentStartTime || !availableStartTimes.includes(currentStartTime)) {
    return {
      availableStartTimes,
      updatedStartTime: undefined,
      updatedEndTime: undefined
    };
  }

  const index = timeSlots.indexOf(currentStartTime);
  const availableEndTimes = timeSlots.slice(index + 1);
  const updatedEndTime = availableEndTimes[0];

  return {
    availableStartTimes,
    updatedStartTime: currentStartTime,
    updatedEndTime
  };
}