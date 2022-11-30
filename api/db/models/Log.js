const mongoose = require('mongoose')
const { ObjectId } = require('mongodb')

const logShcema = new mongoose.Schema({
    username: {
        type: String
    },
    email: {
        type: String
    },
    details: {
        type: String
    },
    module: {
        type: String
    },
    itemId: {
        type: ObjectId
    }
}, { timestamps: true })

const Log = mongoose.model('Log', logShcema)

module.exports = Log