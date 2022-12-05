const express = require('express')
const router = express.Router()
const { ReportModel, User, Log } = require('../db/models')
const transporter = require('../helpers/mailer')

//Get all reports
router.get('/getAll', async (req, res, next) => {
    try {
        const { email } = req.query
        const user = await User.findOne({ email }).exec()

        if (user.isAdmin) {
            const reports = await ReportModel.find().sort([['date', 'descending']])
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
        const newReport = await ReportModel.create(req.body)
        if (!newReport) return res.status(400).json('Error creating report')

        await Log.create({
            username: req.body.username || '',
            email: req.body.email || '',
            details: `New Report created`,
            module: 'Report',
            itemId: newReport._id || null
        })

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

        const updated = await ReportModel.findByIdAndUpdate(_id, reportData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating Report.')

        await Log.create({
            username: req.body.username || '',
            email: req.body.email || '',
            details: `Report updated`,
            module: 'Report',
            itemId: _id || null
        })

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})


module.exports = router