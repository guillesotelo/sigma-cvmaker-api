const mongoose = require('mongoose')

const appDataSchema = new mongoose.Schema({
    data: {
        type: String
    },
    type: {
        type: String
    },
    role: {
        type: String
    }
}, { timestamps: true })

const AppData = mongoose.model('AppData', appDataSchema)

module.exports = AppData