const express = require('express')
const router = express.Router()
const { Resume, Image, Log } = require('../db/models')

//Get Resume data by ID
router.get('/getById', async (req, res, next) => {
    try {
        const { _id } = req.query
        const resume = await Resume.findOne({ _id }).exec()
        if (!resume) return res.status(401).json({ message: 'Resume not found' })

        res.status(200).json(resume)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get Image by email and type
router.get('/getImageByType', async (req, res, next) => {
    try {
        const { name, email, type } = req.query
        let image = null

        if (name) {
            image = await Image.findOne({ name, type, removed: false }).exec()
        }
        else if (email) {
            image = await Image.findOne({ email, type, removed: false }).exec()
        }

        res.status(200).json(image)

    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get Client Logo by Company Name
router.get('/getClientLogo', async (req, res, next) => {
    try {
        const { client } = req.query

        const logo = await Image.findOne({ name: client, removed: false }).exec()

        res.status(200).json(logo || {})
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get CV Logo
router.get('/getCVLogo', async (req, res, next) => {
    try {
        const { type } = req.query
        const logo = await Image.findOne({ type }).exec()
        if (!logo) return res.status(401).json({ message: 'Logo not found' })
        res.status(200).json(logo)

    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new Log
router.post('/createLog', async (req, res, next) => {
    try {
        const { email, username, details, module, itemId } = req.body

        const log = await Log.create({
            username,
            email,
            details,
            module,
            itemId: itemId || null
        })

        if (!log) return res.status(400).json('Error creating Log')

        res.status(200).json(log)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

module.exports = router
