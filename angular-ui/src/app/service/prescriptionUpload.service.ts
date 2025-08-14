import { Injectable } from "@angular/core";
import { PatientService } from "./patient.service";
import { NotificationService } from "./notification.service";

@Injectable({
    providedIn: 'root'
})
export class PrescriptionUploadService {

    constructor(private patientService: PatientService,
        private notificationService: NotificationService
    ) { }

    /**
    * Uploads prescription files and updates the patient record if a new folder is created.
    * Rolls back folder creattion if update fails.
    * 
    * @param files - The prescription files to upload
    * @param patientId - The _id of the patient
    * @param date - The date on which prescription is being uploaded
    * @param existingPrescriptions - Current prescriptions object
    * @returns folderPath of the folder where prescription is saved if successful else returns undefined if any error is not thrown.
    */
    async uploadPrescription(files: File[], patientId: string, date: string,
        existingPrescriptions?: Record<string, string>): Promise<string | undefined> {
        if (!files || files.length == 0)
            return;

        let folderPath: string | undefined;
        try {
            if(existingPrescriptions)
                folderPath = existingPrescriptions[date];

            //If folder path doesn't exist then create
            if (!folderPath) {
                folderPath = await this.patientService.savePrescriptionFile(files, date);
            } else {
                //For existing folder it will append files into it.
                await this.patientService.savePrescriptionFile(files, date);
            }

            // Update prescriptions with today's folder path
            const updatePayload: any = {
                _id: patientId,
                prescriptions: { ...existingPrescriptions, [date]: folderPath }
            };
            await this.patientService.updatePatient(updatePayload);
            this.notificationService.showSuccess('Prescription uploaded successfully.');
            return folderPath;
        } catch (error: any) {
            //Roll back only if it is a new folder
            if (folderPath && existingPrescriptions && !existingPrescriptions[date]) {
                await this.patientService.deletePrescriptionFolder(folderPath);
            }
            this.notificationService.showError('Failed to add prescription: ' + error.message);
            return undefined;
        }
    }

}