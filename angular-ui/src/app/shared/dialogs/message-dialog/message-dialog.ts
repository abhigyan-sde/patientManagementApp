import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

export interface MessageDialogData {
  title: string;
  message: string;
  buttonLabel?: string;
  buttonColor?: 'primary' | 'warn' | 'accent' | ''; // optional, default ''
}

@Component({
  selector: 'app-message-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: 'message-dialog.html',
  styleUrls: ['message-dialog.scss'],
})
export class MessageDialog {
  constructor(
    public dialogRef: MatDialogRef<MessageDialog>,
    @Inject(MAT_DIALOG_DATA) public data: MessageDialogData
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
