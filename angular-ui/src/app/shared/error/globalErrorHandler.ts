import { ErrorHandler, Injectable, NgZone } from "@angular/core";
import { LoggerService } from "../../service/logger.service";

@Injectable()
export class GlobalErrorHandler implements ErrorHandler{

    constructor(private logger : LoggerService,
        private ngZone : NgZone){}

    handleError(error: any): void {
        this.ngZone.run(() => {
            try{
                this.logger.log('error', 'Uncaught exception', error);
            }catch(logError){
                console.error('Logging failure in GlobalErrorHandler', logError);
            }
        });
    }
}