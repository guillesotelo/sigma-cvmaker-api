const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema({
    name: {
        type: String
    },
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
    },
    size: {
        type: String
    },
    removed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const Image = mongoose.model('Image', imageSchema)

module.exports = Image