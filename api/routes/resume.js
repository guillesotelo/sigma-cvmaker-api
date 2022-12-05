const express = require('express')
const router = express.Router()
const { Resume, Image, Log } = require('../db/models')
const transporter = require('../helpers/mailer')
const { REACT_APP_URL } = process.env
const { encrypt, decrypt } = require('../helpers')

//Get all resumes by Manager
router.get('/getAll', async (req, res, next) => {
    try {
        const { email, getAll } = req.query
        let resumes = null

        if (getAll) resumes = await Resume.find().select('-data').sort([['updatedAt', 'descending']])
        else if (email) resumes = await Resume.find({ manager: email }).select('-data').sort([['updatedAt', 'descending']])

        if (!resumes) return res.status(404).send('No users found.')

        res.status(200).json(resumes)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get resume by email
router.get('/myResume', async (req, res, next) => {
    try {
        const { email } = req.body
        const resume = await Resume.findOne({ email }).exec()
        if (!resume) return res.status(401).json({ message: 'Email not found' })

        res.status(200).json(resume)
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

//Save CV Logo
router.post('/saveCVLogo', async (req, res, next) => {
    try {
        const { cvImage, type } = req.body

        await Image.deleteOne({ type })
        const uploaded = await Image.create({ data: cvImage, type })
        if (!uploaded) return res.status(401).json({ message: 'Error uploading logo' })

        await Log.create({
            ...req.body,
            details: `CV Logo uploaded`,
            module: 'Image',
            itemId: req.body._id || null
        })

        res.status(200).json({ message: 'Logo updated successfully' })
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get Resume data by ID
router.get('/getResumeById', async (req, res, next) => {
    try {
        const { _id } = req.body
        const resume = await Resume.findOne({ _id }).exec()
        if (!resume) return res.status(401).json({ message: 'Resume not found' })

        res.status(200).json(resume)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new resume
router.post('/create', async (req, res, next) => {
    try {
        const { email, username, manager, profilePic } = { ...req.body }
        const newResume = await Resume.create(req.body)

        if (!newResume) return res.status(400).json('Error creating CV')

        if (newResume && profilePic) {
            await Image.create({ email: email, data: profilePic })
        }

        await Log.create({
            ...req.body,
            details: `New CV created`,
            module: 'CV',
            itemId: newResume._id || null
        })

        if (manager && username) {
            await transporter.sendMail({
                from: `"Sigma Resume" <${process.env.EMAIL}>`,
                to: manager,
                subject: `A new CV has been created`,
                html: `<table style='margin: auto; color: rgb(51, 51, 51);'>
                        <tbody>
                            <tr>
                                <td style='align-items: center; margin: 3vw auto; text-align: center;'>
                                    <h2>Hello, ${username.split(' ')[0]}!</h2>
                                    <h3>A new CV has been created and added to the platform.</h3>
                                    <div style='margin: 3vw auto; padding: 1vw 1.5vw; text-align:left; border: 1px solid lightgray; border-radius:8px;box-shadow: 2px 2px 15px lightgray;'>
                                        <h3>Name: ${username}</h3>
                                        <h3>Email: ${email}</h3>
                                    </div>
                                    <img src="https://assets.website-files.com/575cac2e09a5a7a9116b80ed/59df61509e79bf0001071c25_Sigma.png" style='width: 120px; margin-top: 3vw; align-self: center;' alt="sigma-logo" border="0"/>
                                    <a href='${REACT_APP_URL}/login'><h5 style='margin: 4px; text-decoration: 'none';'>Sigma CV Maker</h5></a>
                                </td>
                            </tr>
                        </tbody>
                    </table>`
            }).catch((err) => {
                console.error('Something went wrong!', err)
                res.send(500).send('Server Error')
            })
        }
        res.status(200).json({ newResume })
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update resume by ID
router.post('/update', async (req, res, next) => {
    try {
        const { _id, profilePic } = req.body

        const updated = await Resume.findByIdAndUpdate(_id, req.body, { useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating CV')

        if (profilePic) {
            await Image.deleteOne({ email: updated.email })
            await Image.create({ email: updated.email, data: profilePic })
        }

        await Log.create({
            ...req.body,
            details: `CV updated`,
            module: 'CV',
            itemId: _id || null
        })

        res.status(200).json({ message: 'CV updated successfully' })
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
        if (!exists) return res.status(404).send('Error deleting CV')

        const removed = await Resume.deleteOne({ _id })
        if (!removed) return res.status(404).send('Error deleting CV')

        await Log.create({
            ...req.body,
            details: `CV removed`,
            module: 'CV',
            itemId: _id || null
        })

        res.status(200).json({ message: 'CV removed successfully' })
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

module.exports = router