const express = require('express')
const router = express.Router()
const { Report, User } = require('../db/models')
const transporter = require('../helpers/mailer')

//Get all reports
router.get('/getAll', async (req, res, next) => {
    try {
        const { email } = req.query
        const { isAdmin } = await User.findOne({ email }).exec()

        if (isAdmin) {
            const reports = await Report.find().sort([['date', 'descending']])
            if (!reports) return res.status(404).send('No reports found.')

            res.status(200).json(reports)
        } else res.status(403).send('User does not have the required permission')
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new report
router.post('/create', async (req, res, next) => {
    try {
        const newReport = await Report.create(req.body)
        if (!newReport) return res.status(400).json('Error creating report')

        res.status(200).json(newReport)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update Report Data
router.post('/update', async (req, res, next) => {
    try {
        const { _id } = req.body
        let reportData = { ...req.body }

        const updated = await Report.findByIdAndUpdate(_id, reportData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating Report.')

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})


module.exports = router