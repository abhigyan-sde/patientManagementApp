import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-success-dialog',
   imports: [MatDialogModule],
  templateUrl: './success-dialog.html',
  styleUrl: './success-dialog.scss'
})
export class SuccessDialog {
 constructor(
    public dialogRef: MatDialogRef<SuccessDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
