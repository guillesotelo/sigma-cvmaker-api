const mongoose = require('mongoose')

const resumePdfSchema = new mongoose.Schema({
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
    },
    published: {
        type: Date
    },
    publicTime: {
        type: Number
    },
    filename: {
        type: String
    },
    isPdf: {
        type: Boolean,
        default: true
    },
    pdf: {
        type: String
    },
    size: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

const ResumePDF = mongoose.model('ResumePDF', resumePdfSchema)

module.exports = ResumePDF