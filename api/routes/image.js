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
        const newImage = await Image.create(req.body)
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

        console.log("style", req.body.style)

        const updated = await Image.findByIdAndUpdate(_id, { ...req.body }, { returnDocument: "after", useFindAndModify: false })
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

//Remove Image
router.post('/remove', async (req, res, next) => {
    try {
        const { _id, user } = req.body

        const removed = await Image.deleteOne({ _id })
        if (!removed) return res.status(404).send('Error deleting Image')

        await Log.create({
            username: user.username || '',
            email: user.email || '',
            details: `Image removed: ${removed.email}`,
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