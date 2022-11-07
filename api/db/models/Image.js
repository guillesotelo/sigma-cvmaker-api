const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema({
    resumeId: {
        type: ObjectId
    },
    data: {
        type: String
    }
})

const Image = mongoose.model('Image', imageSchema)

module.exports = Image