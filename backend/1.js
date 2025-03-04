const mongoose = require("mongoose");

const masterDbUrl = "mongodb://localhost:27017/master";
const masterDb = mongoose.createConnection(masterDbUrl);
const dbConnections = {};

async function getDbUrl(systemId) {
    const system = await masterDb.collection("systems").findOne({ systemId });
    return system ? system.dbUrl : null;
}

async function getDbConnection(systemId) {
    if (!dbConnections[systemId]) {
        const dbUrl = await getDbUrl(systemId);
        if (!dbUrl) throw new Error("System ID not found");

        dbConnections[systemId] = mongoose.createConnection(dbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    }
    return dbConnections[systemId];
}

module.exports = { getDbConnection };
//to get new dataBASE COnnection....
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const SmpuserSchema=new Schema(
    {
        email: String,
        password: String,
        role: String,
        allowedGroups: [String]
    }
);
const User = mongoose.model('Smp', SmpuserSchema);
module.exports = User;
//user schema
