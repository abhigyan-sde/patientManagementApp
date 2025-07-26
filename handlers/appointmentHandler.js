const appointmentRepo = require('../repository/appointmentRepository');
const { ipcMain } = require('electron');
const { Layer } = require('../shared/constants');
const { getFunctionName } = require('../shared/util');
const {wrapAppError} = require('../shared/errorHandler');

module.exports = function setUpAppointmentHandlers() {
  ipcMain.handle('add-appointment', async (event, appointment) => {
    try {
      const result = await appointmentRepo.createAppointment(appointment);
      return { success: true, id: result };
    } catch (error) {
      throw wrapAppError(error, Layer.HANDLER, getFunctionName() , 'Error occurred in ipc add-appointment handler.');
    }
  });

  // Handle fetching all patients
  ipcMain.handle('get-appointments-by-patient-id', async (event, patientId) => {
    try {
      const appointments = await appointmentRepo.getAppointmentForUser(patientId);
      return { appointments: appointments };
    } catch (error) {
      throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Error occurred in ipc get-appointments-by-patient-id handler.');
    }
  });

  ipcMain.handle('update-appointment', async (event, appointment) => {
    try {
      await appointmentRepo.updateAppointment(appointment);
    } catch (error) {
      throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Error occurred in ipc update-appointment handler.');
    }
  });


  ipcMain.handle('delete-appointment', async (event, id) => {
    try {
      await appointmentRepo.deleteAppointment(id);
      return { success: true, msg: 'Appointment Deleted' };
    } catch (error) {
      throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Error occurred in ipc delete-appointment handler.');
    }
  });

  ipcMain.handle('get-appointments-by-date', async (event, apptDate) => {
    try {
      return await appointmentRepo.getApppointmentsByDate(apptDate);
    } catch (error) {
      throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Error occurred in ipc get-appointments-by-date handler.');
    }
  })
}