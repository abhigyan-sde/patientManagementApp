import { Injectable } from "@angular/core";
import {environment } from '../../environments/environment';
import { electron } from '../shared/electron';

@Injectable({providedIn : 'root'})
export class LoggerService{
    constructor(){}

    log(level: 'info' | 'warn' | 'error', message: string, meta? : any) {
        if(environment.production){
            electron.ipcRenderer.send('app-log', {level, message, meta});
        }else{
            console[level](message,meta);
        }
    }
}