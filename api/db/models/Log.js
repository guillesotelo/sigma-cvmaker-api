const mongoose = require('mongoose')

const logShcema = new mongoose.Schema({
    user: {
        type: String
    },
    details: {
        type: String
    },
    module: {
        type: String
    }
}, { timestamps: true })

const Log = mongoose.model('Log', logShcema)

module.exports = Log