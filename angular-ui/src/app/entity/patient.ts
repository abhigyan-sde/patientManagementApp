import { ObjectId } from 'mongodb';

export interface Patient {
    _id?: String,
    firstName : String,
    lastName : String,
    contactNumber : number,
    email : string | undefined,
    firstVisitDate : Date,
    recentVisitDate : Date,
    prescriptions : any | undefined
}

