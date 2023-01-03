const express = require('express')
const router = express.Router()
const { Image, Log } = require('../db/models')

//Get all images
router.get('/getAll', async (req, res, next) => {
    try {
        const images = await Image.find().sort([['updatedAt', 'descending']])
        if (!images) return res.status(404).send('No Images found.')

        res.status(200).json(images)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new Image
router.post('/create', async (req, res, next) => {
    try {
        const { user } = req.body
        const newImage = await Image.create({
            ...req.body,
            size: Buffer.byteLength(req.body.data, 'utf8')
        })

        if (!newImage) return res.status(400).json('Error creating Image')

        await Log.create({
            username: user.username || '',
            email: user.email || '',
            details: `New Image created, type: ${newImage.type || 'no-type'}`,
            module: 'Image',
            itemId: newImage._id || null
        })

        res.status(200).json(newImage)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update Image
router.post('/update', async (req, res, next) => {
    try {
        const { _id, user } = req.body

        const updated = await Image.findByIdAndUpdate(_id, {
            ...req.body,
            size: Buffer.byteLength(req.body.data, 'utf8')
        }, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating Image')

        await Log.create({
            username: user.username || '',
            email: user.email || '',
            details: `Image updated: ${updated.email}`,
            module: 'Image',
            itemId: _id || null
        })

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        return res.send(500).send('Server Error')
    }
})

//Get Image by email and type
router.get('/getByType', async (req, res, next) => {
    try {
        const { name, email, type } = req.query
        let image = null

        if (name) {
            image = await Image.findOne({ name, type, removed: false }).exec()
        }
        else if (email) {
            image = await Image.findOne({ email, type, removed: false }).exec()
        }

        if (!image) return res.status(404).send('Image not found')
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

//Get all Client Logos
router.get('/getAllClientLogos', async (req, res, next) => {
    try {
        const logos = await Image.find({ type: 'Client Logo', removed: false }).exec()
        if (!logos || !logos.length) return res.status(404).send('No logos found')
        res.status(200).json(logos)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Remove Image
router.post('/remove', async (req, res, next) => {
    try {
        const { _id, user } = req.body

        const image = await Image.findOne({ _id })
        if (!image) return res.status(404).send('Image not found')

        const removed = await Image.findByIdAndUpdate(_id,
            { removed: true },
            { returnDocument: "after", useFindAndModify: false }
        )
        if (!removed) return res.status(404).send('Error deleting Image')

        await Log.create({
            username: user.username || '',
            email: user.email || '',
            details: `Image moved to trash: ${image.email}`,
            module: 'Image',
            itemId: _id || null
        })

        res.status(200).json({ message: 'Image removed successfully' })
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

module.exports = router