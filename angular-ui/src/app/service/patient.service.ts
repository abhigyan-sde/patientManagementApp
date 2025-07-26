import { electron } from '../shared/electron';
import { Injectable } from '@angular/core';
import { Patient } from '../entity/patient';
import { wrapAppError } from '../../../../shared/errorHandler';
import { Layer } from '../../../../shared/constants';
import { getFunctionName } from '../../../../shared/util';

@Injectable({ providedIn: 'root' })
export class PatientService {
  async addPatient(patient: Patient): Promise<any> {
    try {
      var res = electron.ipcRenderer.invoke('add-patient', patient);
      return res.id;
    } catch (error) {
      throw wrapAppError(error, Layer.SERVICE, getFunctionName(), 'Failed to add patient');
    }
  }

  async getAllPatients(page: number, pageSize: number, filter?: string,
    projectionFields: string[] = ['firstName', 'lastName']): Promise<any> {
    try {
      return electron.ipcRenderer.invoke('get-all-patients', { page, pageSize, filter, projectionFields });
    } catch (error) {
      throw wrapAppError(error, Layer.SERVICE, getFunctionName(), 'Failed to retrieve patients');
    }

  }

  // Similarly for update / delete / getById
  async getPatientById(patientId: any): Promise<any> {
    try {
      var res = electron.ipcRenderer.invoke('get-patient-by-id', patientId);
      return res;
    } catch (error) {
      throw wrapAppError(error, Layer.SERVICE, getFunctionName(), 'Failed to retrieve patient by Id');
    }

  }

  async updatePatient(patient: Patient) {
    try {
      return electron.ipcRenderer.invoke('update-patient', patient);
    } catch (error) {
      throw wrapAppError(error, Layer.SERVICE, getFunctionName(), 'Failed to udpate patient');
    }

  }

  async deletePatient(patientId: any): Promise<any> {
    try {
      return electron.ipcRenderer.invoke('delete-patient', patientId);
    } catch (error) {
      throw wrapAppError(error, Layer.SERVICE, getFunctionName(), 'Failed to delete patient');
    }
  }

  async getPrescriptions(folderPath: string): Promise<string[]> {
    try {
      return await electron.ipcRenderer.invoke('get-prescription-images', folderPath);
    } catch (error) {
      throw wrapAppError(error, Layer.SERVICE, getFunctionName(), 'Failed to get prescriptions');
    }
  }

  async savePrescriptionFile(files: File[], folderTimestamp: string): Promise<string> {
    let folderPath = undefined;
    try {
      folderPath = await electron.ipcRenderer.invoke('create-prescription-folder', folderTimestamp);
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const base64String = this.arrayBufferToBase64(arrayBuffer);

        const fileName = `${Date.now()}-${file.name}`;
        const data = {
          fileName,
          fileDataBase64: base64String,
          folderPath
        };

        await electron.ipcRenderer.invoke('save-prescription-file', data);
      }
      return folderPath;

    } catch (error) {
      if (folderPath) {
        await this.deletePrescriptionFolder(folderPath);
      }
      throw wrapAppError(error, Layer.SERVICE, getFunctionName(), 'Failed to save prescription');
    }
  }

  async deletePrescriptionFolder(folderPath: string): Promise<void> {
    try {
      await electron.ipcRenderer.invoke('delete-folder', folderPath);
    } catch (error) {
      throw wrapAppError(error, Layer.SERVICE, getFunctionName(), 'Failed to delete folder : ' + folderPath);
    }
  }

  async deletePrescriptionFile(imgPath: string): Promise<void> {
    try {
      await electron.ipcRenderer.invoke('delete-prescription-file', imgPath);
    } catch (error) {
      throw wrapAppError(error, Layer.SERVICE, getFunctionName(), 'Failed to delete file : ' + imgPath);
    }
  }
  
  setWorkspacePath(newPath: string): Promise<void> {
    try {
      return electron.ipcRenderer.invoke('set-workspace-path', newPath);
    } catch (error) {
      throw wrapAppError(error, Layer.SERVICE, getFunctionName(), 'Failed to setworkspace path');
    }
  }

  async loadImageFolderBase64(filePath: string): Promise<{ path: string, preview: string }[]> {
    return await window.electron.ipcRenderer.invoke('load-image-folder-base64', filePath);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
