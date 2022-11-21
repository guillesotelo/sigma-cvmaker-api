const express = require('express')
const router = express.Router()
const { Report } = require('../db/models')
const transporter = require('../helpers/mailer')

router.get('/getAll', async (req, res, next) => {
    try {
        const reports = await Resume.find().sort([['date', 'descending']])
        if (!reports) return res.status(404).send('No reports found.')

        res.status(200).json(reports)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

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

module.exports = router