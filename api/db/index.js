const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const { DB_PROJECT, DB_PASS, DB_CONFIG } = process.env

const uri = `mongodb+srv://${DB_PROJECT}:${DB_PASS}@${DB_CONFIG}`;

const connectToMongo = async () => {
    try {
        mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => console.log('* DB Connected to Cluster *'))
    } catch (err) {
        console.log('Error connecting to Cluster', err)
    }
}

const tryConnection = async (fn, attempts) => {
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn()
            break
        } catch (_) {
            if (i < 5) setTimeout(() => tryConnection(fn, i), 500)
        }
    }
}

tryConnection(connectToMongo, 5)
  
module.exports = mongoose