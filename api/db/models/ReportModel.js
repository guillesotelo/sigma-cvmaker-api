const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
    username: {
        type: String
    },
    email: {
        type: String
    },
    title: {
        type: String
    },
    description: {
        type: String
    },
    isFixed: {
        type: Boolean,
        defaul: false
    }
}, { timestamps: true })

const ReportModel = mongoose.model('ReportModel', reportSchema)

module.exports = ReportModel