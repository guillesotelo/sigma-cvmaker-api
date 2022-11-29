const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema({
    email: {
        type: String
    },
    data: {
        type: String
    },
    style: {
        type: String
    },
    type: {
        type: String
    }
}, { timestamps: true })

const Image = mongoose.model('Image', imageSchema)

module.exports = Image