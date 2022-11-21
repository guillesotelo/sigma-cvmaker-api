const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
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
})

const Report = mongoose.model('Report', reportSchema)

module.exports = Report