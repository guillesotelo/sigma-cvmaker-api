const express = require('express')
const router = express.Router()
const { AppData, Log, User } = require('../db/models')

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
        const { email, type } = req.query
        const user = await User.findOne({ email }).exec()

        if (user && user.isManager) {
            const appData = await AppData.findOne({ type }).exec()
            if (!appData) return res.status(304).send('No App Data found.')
            
            res.status(200).json(appData)
        } else res.status(403).send('User does not have the required permission')
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new App Data
router.post('/create', async (req, res, next) => {
    try {
        const newData = await AppData.create(req.body)
        if (!newData) return res.status(400).json('Error creating App Data')

        await Log.create({
            ...req.body,
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
        const { type } = req.body
        let newData = { ...req.body }

        const updated = await User.findOneAndUpdate(
            { type }, newData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating App Data.')

        await Log.create({
            ...newData,
            details: `App Data updated, type: ${type || 'no type'}`,
            module: 'App Data',
            itemId: newData._id || null
        })

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})


module.exports = router