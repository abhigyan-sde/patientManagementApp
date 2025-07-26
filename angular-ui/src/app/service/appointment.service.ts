import { Injectable } from '@angular/core';
import { electron } from '../shared/electron';
import { AppointmentEntity } from '../entity/appointment';
import { wrapAppError } from '../../../../shared/errorHandler';
import { Layer } from '../../../../shared/constants';
import { getFunctionName } from '../../../../shared/util'
@Injectable({
  providedIn: 'root'
})
export class AppointmentService {

  constructor() {}

  async getAppointmentsByPatientId(patientId: any): Promise<AppointmentEntity[]> {
    try{
       const { appointments } = await electron.ipcRenderer.invoke('get-appointments-by-patient-id', patientId);
       return appointments;
    }catch(error){
      throw wrapAppError(error, Layer.SERVICE, getFunctionName(), 'Failed to retrieve Appointments for current patient.');
    }
    
  }

  async addAppointment(appointment: AppointmentEntity): Promise<string> {
     try{
      var res = await electron.ipcRenderer.invoke('add-appointment', appointment);
      return res.id;
    }catch(error){
      throw wrapAppError(error, Layer.SERVICE, getFunctionName(), 'Failed to create Appointment');
    }
    
  }

  async updateAppointment(appointment: AppointmentEntity): Promise<void> {
     try{
      await electron.ipcRenderer.invoke('update-appointment', appointment);
    }catch(error){
      throw wrapAppError(error, Layer.SERVICE, getFunctionName(), 'Failed to update Appointment');
    }
   
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
     try{
        return await electron.ipcRenderer.invoke('delete-appointment', appointmentId);
    }catch(error){
      throw wrapAppError(error, Layer.SERVICE, getFunctionName(), 'Failed to delete Appointment');
    }
    
  }

  async getAppointmentsByDate(appointmentDate: string): Promise<AppointmentEntity[]>{
     try{
        return await electron.ipcRenderer.invoke('get-appointments-by-date', appointmentDate);
    }catch(error){
      throw wrapAppError(error, Layer.SERVICE, getFunctionName(), 'Failed to get appointments by date');
    }
    
  }
}