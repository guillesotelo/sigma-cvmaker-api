const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema({
    resumeId: {
        type: ObjectId
    },
    email: {
        type: String
    },
    data: {
        type: String
    },
    style: {
        type: String
    }
}, { timestamps: true })

const Image = mongoose.model('Image', imageSchema)

module.exports = Image