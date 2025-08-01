const { getDb } = require('./mongoService');
const { ObjectId } = require('mongodb');
const { wrapAppError } = require('../shared/errorHandler');
const { Layer } = require('../shared/constants');

tableName = 'appointments';
const db = getDb();
const appointmentCollection = db.collection(tableName);

async function createAppointment(appointment) {
    try {
        const result = await appointmentCollection.insertOne(appointment);
        return result.insertedId;
    } catch (error) {
        throw wrapAppError(error, Layer.REPOSITORY, createAppointment.name, 'Failed to create Appointment');
    }
}

async function updateAppointment(apptUpdate) {
    try {
        const{ _id, ...updateData} = apptUpdate;
        await appointmentCollection.updateOne(
            { _id: ObjectId.createFromHexString(_id) },
            { $set: updateData }
        );
    } catch (error) {
        throw wrapAppError(error, Layer.REPOSITORY, updateAppointment.name, 'Failed to update Appointment');
    }
}

async function deleteAppointment(appointmentId) {
    try {
        const _id = typeof appointmentId === 'string' ? ObjectId.createFromHexString(appointmentId) : appointmentId;
        const result = await appointmentCollection.deleteOne({ _id: _id });
    } catch (error) {
        throw wrapAppError(error, Layer.REPOSITORY, deleteAppointment.name, 'Failed to delete Appointment');
    }
}

async function getAppointmentForUser(patientId) {
    try {
        const result = await appointmentCollection
            .find({ patientId })
            .toArray();

        // Convert ObjectId to string for IPC
        const serialized = result.map(doc => ({
            ...doc,
            _id: doc._id.toString(), // Important!
        }));
        return serialized;
    } catch (error) {
        throw wrapAppError(error, Layer.REPOSITORY, getAppointmentForUser.name, 'Failed to retrieve appointments for userId : ' + userId);
    }
}

async function getApppointmentsByDate(apptDate) {
    try {
        const sortFields = { startTime: 1 };
        const result = await appointmentCollection.find({ appointmentDate: apptDate }).sort(sortFields).toArray();
        const sanitized = result.map(appt => ({
            _id: appt._id.toString(),          // Convert ObjectId to string
            appointmentDate: appt.appointmentDate,
            patientId: appt.patientId,
            startTime: appt.startTime,
            endTime: appt.endTime,
            description: appt.description
        }));
        return sanitized;
    } catch (error) {
        throw wrapAppError(error, Layer.REPOSITORY, getApppointmentsByDate.name, 'Failed to retrieve appointments by date');
    }
}

module.exports = {
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentForUser,
    getApppointmentsByDate
}