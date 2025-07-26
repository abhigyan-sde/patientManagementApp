import { ObjectId } from 'mongodb';

export interface AppointmentEntity {
   _id?: string,
  patientId: string; 
  appointmentDate: string; 
  startTime: string; 
  endTime: string;  
  description: string;
}
