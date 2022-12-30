const express = require('express')
const router = express.Router()
const { AppData, Log, User, Image, Resume } = require('../db/models')

//Get all App Data
router.get('/getAll', async (req, res, next) => {
    try {
        const { email } = req.query
        const user = await User.findOne({ email }).exec()

        if (user && user.isManager) {
            const appData = await AppData.find().sort([['updatedAt', 'descending']])
            if (!appData) return res.status(304).send('No App Data found.')

            res.status(200).json(appData)
        } else res.status(403).send('User does not have the required permission')
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get App Data by type
router.get('/getByType', async (req, res, next) => {
    try {
        const { type } = req.query

        const appData = await AppData.findOne({ type }).exec()
        if (!appData) return res.status(304).send('No App Data found.')

        res.status(200).json(appData)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new App Data
router.post('/create', async (req, res, next) => {
    try {
        const { clientLogo, clientName, clientEmail } = req.body
        const newData = await AppData.create(req.body)
        if (!newData) return res.status(400).json('Error creating App Data')

        if (clientLogo && clientLogo.logoImage && clientEmail) {
            await Image.create({
                name: clientName,
                email: clientEmail,
                data: clientLogo.logoImage,
                type: 'Client Logo',
                style: clientLogo.style ? JSON.stringify(clientLogo.style) : '',
                size: Buffer.byteLength(clientLogo.logoImage, 'utf8')
            })
        }

        await Log.create({
            username: req.body.username || '',
            email: req.body.email || '',
            details: `New App Data created, type: ${req.body.type || 'no type'}`,
            module: 'App Data',
            itemId: newData._id || null
        })

        res.status(200).json(newData)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update App Data
router.post('/update', async (req, res, next) => {
    try {
        const { type, data, clientLogo, clientName, clientEmail } = req.body

        const updated = await AppData.findOneAndUpdate(
            { type }, { data }, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating App Data.')

        if (clientLogo && clientLogo.logoImage && clientEmail) {
            await Image.deleteOne({ email: clientEmail })
            await Image.create({
                name: clientName,
                email: clientEmail,
                data: clientLogo.logoImage,
                type: 'Client Logo',
                style: clientLogo.style ? JSON.stringify(clientLogo.style) : '',
                size: Buffer.byteLength(clientLogo.logoImage, 'utf8')
            })
        }

        await Log.create({
            username: req.body.username || '',
            email: req.body.email || '',
            details: `App Data updated, type: ${type || 'no type'}`,
            module: 'App Data',
            itemId: updated._id || null
        })

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get all removed items
router.get('/getRemovedItems', async (req, res, next) => {
    try {
        const { email } = req.query
        const user = await User.findOne({ email }).exec()

        if (user && user.isManager) {

            const removedItems = {
                images: await Image.find({ removed: true }).sort([['updatedAt', 'descending']]),
                resumes: await Resume.find({ removed: true }).sort([['updatedAt', 'descending']]),
                users: await User.find({ removed: true }).select('-password').sort([['updatedAt', 'descending']]),
            }

            if (!Object.keys(removedItems).length) return res.status(304).send('No removed items found.')

            res.status(200).json(removedItems)
        } else res.status(403).send('User does not have the required permission')
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Restore Item
router.get('/restoreItem', async (req, res, next) => {
    try {
        const { email, _id, item } = req.query
        const user = await User.findOne({ email }).exec()

        if (user && user.isManager && item) {
            const module = item === `CV's` ? 'CV' : item === `Images` ? 'Image' : item === `Users` ? 'User' : '' 
            let restored = null

            if (item === `CV's`) restored = await Resume.findByIdAndUpdate(_id, { removed: false }, { returnDocument: "after", useFindAndModify: false })
            else if (item === `Images`) restored = await Image.findByIdAndUpdate(_id, { removed: false }, { returnDocument: "after", useFindAndModify: false })
            else if (item === `Users`) restored = await User.findByIdAndUpdate(_id, { removed: false }, { returnDocument: "after", useFindAndModify: false })

            if (!restored) return res.status(304).send('Error restoring item')

            await Log.create({
                username: user.username || '',
                email: user.email || '',
                details: `${module} restored: ${restored.email}`,
                module,
                itemId: _id || null
            })

            res.status(200).json(restored)
        } else res.status(403).send('User does not have the required permission')
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Remove Item permanently
router.get('/removeItem', async (req, res, next) => {
    try {
        const { email, _id, item } = req.query
        const user = await User.findOne({ email }).exec()

        if (user && user.isManager && item) {
            const module = item === `CV's` ? 'CV' : item === `Images` ? 'Image' : item === `Users` ? 'User' : '' 
            let removed = null

            if (item === `CV's`) removed = await Resume.deleteOne({ _id })
            else if (item === `Images`) removed = await Image.deleteOne({ _id })
            else if (item === `Users`) removed = await User.deleteOne({ _id })

            if (!removed) return res.status(304).send('Error deleting item')

            await Log.create({
                username: user.username || '',
                email: user.email || '',
                details: `${module} removed permanently: ${removed.email || '-'}`,
                module,
                itemId: _id || null
            })

            res.status(200).json(removed)
        } else res.status(403).send('User does not have the required permission')
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})


module.exports = router