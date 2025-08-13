const { Layer } = require('../shared/constants');
const { wrapAppError } = require('../shared/errorHandler');
const { getDb } = require('./mongoService');
const { ObjectId } = require('mongodb');

tableName = 'patients';
const db = getDb();
const patientCollection = db.collection(tableName);

async function addPatient(patient) {
  try {
    const result = await patientCollection.insertOne(patient);
    return result.insertedId.toString();
  } catch (error) {
    throw wrapAppError(error, Layer.REPOSITORY, addPatient.name, 'Failed to add patient');
  }
}

async function getAllPatients(page = 0, pageSize = 10,
   filter = '', projectionFields = ['firstName', 'lastName']) {
  try {
    const db = getDb();
    const query = filter ? {
      $or: [
        { firstName: { $regex: filter, $options: 'i' } },
        { lastName: { $regex: filter, $options: 'i' } }
      ]
    }
      : {};

    const projectFields = projectionFields.reduce(function (acc, field) {
      acc[field] = 1;
      return acc;
    }, {});

    const patientsFromDB = await patientCollection
      .find(query)
      .project(projectFields)
      .skip(page * pageSize)
      .limit(pageSize)
      .toArray();

    const patients = patientsFromDB.map(function (p) {
      const result = { _id: p._id.toString() };
      projectionFields.forEach(function (field) {
        result[field] = p[field];
      });
      return result;
    });

    const total = await getTotalCount(query);
    return { patients, total };
  } catch (error) {
    throw wrapAppError(error, Layer.REPOSITORY, getAllPatients.name, 'Failed to retrieve patients');
  }
}


async function getPatientById(id) {
  try {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid ObjectId provided : ' + id);
    }
    const _id = typeof id === 'string' ? ObjectId.createFromHexString(id) : id;
    return await patientCollection.findOne({ _id: _id });
  } catch (error) {
    throw wrapAppError(error, Layer.REPOSITORY, getPatientById.name, 'Failed to retrieve patient');
  }
}

async function updatePatient(patientUpdate) {
  try {
    if (!ObjectId.isValid(patientUpdate._id)) {
      throw new Error('Invalid ObjectId provided : ' + patientUpdate._id);
    }
    const db = getDb();
    const id = patientUpdate._id;
    delete patientUpdate._id;
    result = await patientCollection.updateOne(
      { _id: ObjectId.createFromHexString(id) },
      { $set: patientUpdate }
    );

    if (result.matchedCount == 0)
      console.log("No update took place.")
  } catch (error) {
    throw wrapAppError(error, Layer.REPOSITORY, updatePatient.name, 'Failed to update patient');
  }
}

async function deletePatient(id) {
  try {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid ObjectId provided : ' + id);
    }

    await patientCollection.deleteOne({ _id: ObjectId.createFromHexString(id) });
  } catch (error) {
    throw wrapAppError(error, Layer.REPOSITORY, deletePatient.name, 'Failed to delete patient');
  }
}

async function getTotalCount(query) {
  try {
    return await patientCollection.countDocuments(query);
  } catch (error) {
    throw wrapAppError(error, Layer.REPOSITORY, getTotalCount.name, 'Failed to get total patient count');
  }

}

module.exports = {
  addPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient
};
