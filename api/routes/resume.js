const express = require('express')
const router = express.Router()
const { Resume } = require('../db/models')
const { encrypt, decrypt } = require('../helpers')

//Get all resumes by Manager
router.get('/getAll', async (req, res, next) => {
    try {
        const { email } = req.query
        console.log("req.query", req.query)
        if (email) {
            const resumes = await Resume.find({ manager: email }).sort([['date', 'descending']])
            if (!resumes) return res.status(404).send('No resumes found.')

            res.status(200).json(resumes)
        }
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

router.get('/myResume', async (req, res, next) => {
    try {
        const { email } = req.body
        const resume = Resume.findOne({ email }).exec()
        if (!resume) return res.status(401).json({ message: 'Email not found' })

        res.status(200).json(resume)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new resume
router.post('/create', async (req, res, next) => {
    try {
        const newResume = await Resume.create(req.body)
        res.status(200).json({ newResume })
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update resume by ID
router.post('/update', async (req, res, next) => {
    try {
        const { _id } = req.body

        const updated = await Resume.findByIdAndUpdate(_id, req.body, { useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating resume')

        res.status(200).json({ message: 'Resume updated successfully' })
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Remove Mocement by ID
router.post('/remove', async (req, res, next) => {
    try {
        const { _id } = req.body
        const exists = await Resume.findOne({ _id }).exec()
        if (!exists) return res.status(404).send('Error deleting resume')

        const removed = await Resume.deleteOne({ _id })
        if (!removed) return res.status(404).send('Error deleting resume')

        res.status(200).json({ message: 'Resume removed successfully' })
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

module.exports = router