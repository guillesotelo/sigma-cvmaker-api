const mongoose = require('mongoose')

const resumeSchema = new mongoose.Schema({
    username: {
        type: String
    },
    email: {
        type: String
    },
    data: {
        type: String
    },
    manager: {
        type: String
    },
    role: {
        type: String
    }
}, { timestamps: true })

const Resume = mongoose.model('Resume', resumeSchema)

module.exports = Resume