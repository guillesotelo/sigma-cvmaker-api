const mongoose = require('mongoose')

const resumeSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: new Date()
    },
    username: {
        type: String
    },
    email: {
        type: String
    },
    data: {
        type: String
    },
    managerName: {
        type: String
    },
    managerEmail: {
        type: String
    },
    role: {
        type: String
    },
    template: {
        type: String
    },
    type: {
        type: String
    },
    client: {
        type: String
    },
    note: {
        type: String
    },
    removed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const Resume = mongoose.model('Resume', resumeSchema)

module.exports = Resume