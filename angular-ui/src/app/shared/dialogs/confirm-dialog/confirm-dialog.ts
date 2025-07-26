import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'confirm-dialog',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule],
    templateUrl: 'confirm-dialog.html',
    styleUrls: ['confirm-dialog.scss']
})
export class ConfirmDialog {
    constructor(
        public dialogRef: MatDialogRef<ConfirmDialog>,
        @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
    ) {}

    confirm(): void {
        this.dialogRef.close(true);
    }

    cancel(): void {
        this.dialogRef.close(false);
    }
}
