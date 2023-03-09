const express = require('express')
const router = express.Router()
const { Resume, Image, Log, ResumePDF } = require('../db/models')
const transporter = require('../helpers/mailer')
const { REACT_APP_URL } = process.env
const { encrypt, decrypt, calculateStringSize } = require('../helpers')

//Get all resumes by Manager
router.get('/getAll', async (req, res, next) => {
    try {
        const { getAll, managerEmail } = req.query
        let resumes = null

        if (getAll) resumes = await Resume.find({ removed: false }).sort([['updatedAt', 'descending']])
        else if (managerEmail) resumes = await Resume.find({ managerEmail }).sort([['updatedAt', 'descending']])

        const pdfResumes = await ResumePDF.find({ removed: false }).select('-pdf').sort([['updatedAt', 'descending']])

        if (!resumes) return res.status(200).json([])

        res.status(200).json(resumes.concat(pdfResumes))
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

//Publish resume
router.post('/publish', async (req, res, next) => {
    try {
        const { _id, publicTime, user } = req.body
        const publicData = {
            publicTime: publicTime || publicTime === 0 ? publicTime : 30,
            published: new Date()
        }

        const resume = await Resume.findByIdAndUpdate(_id, publicData, { returnDocument: "after", useFindAndModify: false })
        if (!resume) return res.status(401).json({ message: 'Error updating CV' })

        await Log.create({
            username: user.username || '',
            email: user.email || '',
            details: `CV published: ${resume.username} - ${resume.role} (${publicTime} days)`,
            module: 'CV',
            itemId: resume._id || null
        })

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
        const uploaded = await Image.create({
            data: cvImage,
            name: 'Main CV Image',
            type: type || 'CV Logo',
            size: Buffer.byteLength(cvImage, 'utf8')
        })
        if (!uploaded) return res.status(401).json({ message: 'Error uploading logo' })

        await Log.create({
            username: req.body.username || '',
            email: req.body.email || '',
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

//Get Master Resume
router.get('/getByType', async (req, res, next) => {
    try {
        const { email, type } = req.query
        const cv = await Resume.findOne({ email, type }).exec()
        if (!cv) return res.status(401).json({ message: 'CV not found' })

        res.status(200).json(cv)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new resume
router.post('/create', async (req, res, next) => {
    try {
        const {
            email,
            username,
            profilePic,
            clientLogos,
            clients,
            user,
            signatureCanvas,
            type,
            data,
            pdfData
        } = { ...req.body }

        req.body.size = pdfData?.size ? pdfData.size : calculateStringSize(data)

        let newResume = {}
        if (pdfData?.pdf) newResume = await ResumePDF.create({ ...req.body, ...pdfData })
        else newResume = await Resume.create(req.body)

        if (!newResume?._id) return res.status(400).json('Error creating CV')

        const profile = await Image.findOne({ email, type: 'Profile' }).exec()
        const signature = await Image.findOne({ email, type: 'Signature' }).exec()

        if ((profile && type === 'Master') || !profile) {
            if (newResume && profilePic?.image) {
                const imageData = {
                    name: username,
                    email: email,
                    data: profilePic.image,
                    type: 'Profile',
                    style: profilePic.style ? JSON.stringify(profilePic.style) : '',
                    size: Buffer.byteLength(profilePic.image, 'utf8')
                }
                if (profile) await Image.findByIdAndUpdate(profile._id, imageData, { useFindAndModify: false })
                else await Image.create(imageData)

                await Log.create({
                    username: user && user.username || '',
                    email: user && user.email || '',
                    details: `Image ${profile ? 'updated' : 'created'}: ${username}, type: Profile`,
                    module: 'Image',
                    itemId: newResume._id || null
                })
            }
        }

        if ((signature && type === 'Master') || !signature) {
            if (newResume && signatureCanvas?.image) {
                const signatureData = {
                    name: username,
                    email: email,
                    data: profilePic.image,
                    type: 'Profile',
                    style: profilePic.style ? JSON.stringify(profilePic.style) : '',
                    size: Buffer.byteLength(profilePic.image, 'utf8')
                }
                if (signature) await Image.findByIdAndUpdate(signature._id, signatureData, { useFindAndModify: false })
                else await Image.create(signatureData)

                await Log.create({
                    username: user && user.username || '',
                    email: user && user.email || '',
                    details: `Image ${signature ? 'updated' : 'created'}: ${username}, type: Signature`,
                    module: 'Image',
                    itemId: newResume._id || null
                })
            }
        }

        if (clientLogos && clients) {
            Object.keys(clientLogos).forEach(async index => {

                const exists = await Image.findOne({
                    name: clients[index],
                    type: 'Client Logo',
                    removed: false
                }).exec()

                if (!exists && clientLogos[index] && clientLogos[index].image) {
                    await Image.create({
                        name: clients[index],
                        email: '',
                        data: clientLogos[index].image || '',
                        type: 'Client Logo',
                        style: clientLogos[index].style ? JSON.stringify(clientLogos[index].style) : '',
                        size: Buffer.byteLength(clientLogos[index].image || '', 'utf8')
                    })

                    await Log.create({
                        username: user && user.username || '',
                        email: user && user.email || '',
                        details: `New image created: ${clients[index]}, type: Client Logo`,
                        module: 'Image',
                        itemId: newResume._id || null
                    })
                }
            })
        }

        await Log.create({
            username: user && user.username || '',
            email: user && user.email || '',
            details: `New CV created: ${newResume.username || ''} - ${newResume.role || ''}`,
            module: 'CV',
            itemId: newResume._id || null
        })

        res.status(200).json({ newResume })
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update resume by ID
router.post('/update', async (req, res, next) => {
    try {
        const {
            _id,
            type,
            email,
            profilePic,
            signatureCanvas,
            clientLogos,
            clients,
            user,
            data,
            pdfData
        } = req.body

        req.body.size = pdfData?.size ? pdfData.size : calculateStringSize(data)

        let updated = {}
        if (pdfData?.pdf) updated = await ResumePDF.findByIdAndUpdate(_id, { ...req.body, ...pdfData }, { useFindAndModify: false })
        else updated = await Resume.findByIdAndUpdate(_id, req.body, { useFindAndModify: false })

        if (!updated?._id) return res.status(404).send('Error updating CV')

        if (updated) {
            if (profilePic && profilePic.image) {
                const imageData = {
                    name: updated.username,
                    email: updated.email,
                    data: profilePic.image,
                    type: 'Profile',
                    style: profilePic.style ? JSON.stringify(profilePic.style) : '',
                    size: Buffer.byteLength(profilePic.image, 'utf8')
                }
                const { _id } = await Image.findOne({ email, type: 'Profile' }).exec()
                if (_id) await Image.findByIdAndUpdate(_id, imageData, { useFindAndModify: false })
                else await Image.create(imageData)

                await Log.create({
                    username: user && user.username || '',
                    email: user && user.email || '',
                    details: `Image ${_id ? 'updated' : 'created'}: ${updated.username}, type: Profile`,
                    module: 'Image',
                    itemId: updated._id || null
                })
            }

            if (signatureCanvas && signatureCanvas.image) {
                const signatureData = {
                    name: updated.username,
                    email: updated.email,
                    data: signatureCanvas.image,
                    type: 'Signature',
                    style: signatureCanvas.style ? JSON.stringify(signatureCanvas.style) : '',
                    size: Buffer.byteLength(signatureCanvas.image, 'utf8')
                }
                const { _id } = await Image.findOne({ email, type: 'Signature' }).exec()
                if (_id) await Image.findByIdAndUpdate(_id, signatureData, { useFindAndModify: false })
                else await Image.create(signatureData)

                await Log.create({
                    username: user && user.username || '',
                    email: user && user.email || '',
                    details: `Image ${_id ? 'updated' : 'created'}: ${updated.username}, type: Signature`,
                    module: 'Image',
                    itemId: updated._id || null
                })
            }

            if (clientLogos && clients) {
                Object.keys(clientLogos).forEach(async index => {
                    if (clients[index]) {
                        const exists = await Image.findOne({
                            name: clients[index],
                            type: 'Client Logo',
                            removed: false
                        }).exec()

                        if (!exists && clientLogos[index] && clientLogos[index].image) {
                            await Image.create({
                                name: clients[index],
                                email: '',
                                data: clientLogos[index].image || '',
                                type: 'Client Logo',
                                style: clientLogos[index].style ? JSON.stringify(clientLogos[index].style) : '',
                                size: Buffer.byteLength(clientLogos[index].image || '', 'utf8')
                            })

                            await Log.create({
                                username: user && user.username || '',
                                email: user && user.email || '',
                                details: `New image created: ${updated.username}, type: Client Logo`,
                                module: 'Image',
                                itemId: updated._id || null
                            })
                        }
                    }
                })
            }

            if (type === 'Master') {
                delete req.body._id
                delete req.body.type
                delete req.body.removed
                await Resume.updateMany({ email, type: 'Variant' }, req.body)
            }
        }

        await Log.create({
            username: user && user.username || '',
            email: user && user.email || '',
            details: `CV updated: ${updated.username || ''} - ${updated.role || ''}`,
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
        const { _id, user, email } = req.body
        const exists = await Resume.findOne({ _id }).exec()
        if (!exists) return res.status(404).send('Error deleting CV')

        const removed = await Resume.findByIdAndUpdate(_id, { removed: true }, { useFindAndModify: false })
        let variants = null

        if (exists.type === 'Master') {
            const image = await Image.findOneAndUpdate(
                { email: exists.email, type: 'Signature' },
                { removed: true },
                { returnDocument: "after", useFindAndModify: false }
            )

            if (image) {
                await Log.create({
                    username: user && user.username || '',
                    email: user && user.email || '',
                    details: `Image moved to trash: ${exists.username}, type: Signature`,
                    module: 'Image',
                    itemId: exists._id || null
                })
            }

            variants = await Resume.updateMany({ email, type: 'Variant' }, { removed: true })
        }

        if (!removed) return res.status(404).send('Error deleting CV')

        await Log.create({
            username: user.username || '',
            email: user.email || '',
            details: variants && variants.length ? `CV moved to trash along with ${variants.length} variants: ${exists.username}`
                : `CV moved to trash: ${exists.username}`,
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