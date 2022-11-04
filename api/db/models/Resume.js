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
    manager: {
        type: String
    },
    role: {
        type: String
    }
})

const Resume = mongoose.model('Resume', resumeSchema)

module.exports = Resume