const patientRepo = require('../repository/patientRepository');
const { ipcMain } = require('electron');
const { Layer } = require('../shared/constants');
const { getFunctionName } = require('../shared/util');
const {wrapAppError} = require('../shared/errorHandler');

module.exports = function setUpPatientHandlers() {
  ipcMain.handle('add-patient', async (event, patient) => {
    try {
      return await patientRepo.addPatient(patient);
    } catch (error) {
      throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Error occurred in ipc add-patient handler.');
    }
  });

  // Handle fetching all patients
  ipcMain.handle('get-all-patients', async (event, { page, pageSize, filter, projectionFields }) => {
    try {
      return await patientRepo.getAllPatients(page, pageSize, filter, projectionFields);
    } catch (error) {
      throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Error occurred in ipc get-all-patients handler.');
    }
  });

  ipcMain.handle('get-patient-by-id', async (event, patientId) => {
    try {
      return await patientRepo.getPatientById(patientId);
    } catch (error) {
      throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Error occurred in ipc get-patient-by-id handler.');
    }
  });

  ipcMain.handle('update-patient', async (event, patientUpdate) => {
    try {
      await patientRepo.updatePatient(patientUpdate);
      return { success: true};
    } catch (error) {
      throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Error occurred in ipc update-patient handler.');
    }
  });

  ipcMain.handle('delete-patient', async (event, id) => {
    try {
      const result = await patientRepo.deletePatient(id);
      return { success: true, result };
    } catch (error) {
      throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Error occurred in ipc delete-patient handler.');
    }
  });
}