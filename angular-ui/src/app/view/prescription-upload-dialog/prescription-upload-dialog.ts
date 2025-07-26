import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'prescription-dialog',
  standalone: true,
  templateUrl: './prescription-upload-dialog.html',
  styleUrl: './prescription-upload-dialog.scss',
  imports: [CommonModule, MatDialogModule, MatButtonModule]
})
export class AddPrescriptionDialog {
  files: File[] = [];

  constructor(public dialogRef: MatDialogRef<AddPrescriptionDialog>) {}

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.files = Array.from(input.files);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  upload(): void {
    this.dialogRef.close(this.files);
  }
}
