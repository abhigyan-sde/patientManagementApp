import { ObjectId } from 'mongodb';

export interface Patient {
    _id?: string,
    firstName : string,
    lastName : string,
    contactNumber : number,
    email : string | undefined,
    firstVisitDate : Date,
    recentVisitDate : Date,
    prescriptions : Record<string, string>
}

