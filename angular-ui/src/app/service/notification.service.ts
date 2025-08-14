import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialog } from '../shared/dialogs/message-dialog/message-dialog';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private dialog: MatDialog) {}

  showSuccess(message: string) {
    this.dialog.open(MessageDialog, {
      data: {
        title: 'Success',
        message,
        buttonLabel: 'OK',
        buttonColor: 'primary',
      }
    });
  }

  showError(message: string) {
    this.dialog.open(MessageDialog, {
      data: {
        title: 'Error',
        message,
        buttonLabel: 'Close',
        buttonColor: 'warn',
      }
    });
  }
}
