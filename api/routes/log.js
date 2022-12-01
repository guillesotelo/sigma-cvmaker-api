const express = require('express')
const router = express.Router()
const { Log, User} = require('../db/models')

//Get all logs
router.get('/getAll', async (req, res, next) => {
    try {
        const { email } = req.query
        const user = await User.findOne({ email }).exec()

        if (!user || user.isManager) {
            const logs = await Log.find().sort([['updatedAt', 'descending']])
            if (!logs) return res.status(404).send('No logs found.')

            res.status(200).json(logs)
        } else res.status(403).send('User does not have the required permission')
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

module.exports = router