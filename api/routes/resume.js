const express = require('express')
const router = express.Router()
const { Resume, Image } = require('../db/models')
const { encrypt, decrypt } = require('../helpers')

//Get all resumes by Manager
router.get('/getAll', async (req, res, next) => {
    try {
        const { email, getAll } = req.query

        if (getAll) {
            const resumes = await Resume.find().sort([['date', 'descending']])
            if (!resumes) return res.status(404).send('No resumes found.')

            return res.status(200).json(resumes)
        }
        else if (email) {
            const resumes = await Resume.find({ manager: email }).sort([['date', 'descending']])
            if (!resumes) return res.status(404).send('No resumes found.')

            return res.status(200).json(resumes)
        }
        return res.status(404).send('No resumes found.')
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Migration of profile images to new DB (One use only)
// router.get('/migrateImages', async (req, res, next) => {
//     try {
//         const resumes = await Resume.find()
//         if (resumes) {
//             resumes.forEach(async (resume, i) => {
//                 const newData = JSON.parse(resume.data)

//                 delete newData.profilePic
//                 delete newData.signature

//                 const saved = await Resume.findOneAndUpdate({ _id: resume._id }, { data: JSON.stringify(newData) }, { returnDocument: "after", useFindAndModify: false })
//                 console.log(`saved ${i}`, saved)
//             })
//         }

//         return res.status(200).json('Migrated successfully')
//     } catch (err) {
//         console.error('Something went wrong!', err)
//         res.send(500).send('Server Error')
//     }
// })


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
        const { profilePic } = { ...req.body }
        const newResume = await Resume.create(req.body)

        if (newResume && profilePic) {
            await Image.create({ resumeId: newResume._id, data: profilePic })
        }
        res.status(200).json({ newResume })
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get Profile Image by Resume ID
router.get('/getProfileImage', async (req, res, next) => {
    try {
        const { _id } = req.query
        const profileImage = await Image.findOne({ resumeId: _id }).exec()
        res.status(200).json(profileImage)

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
        if (!updated) return res.status(404).send('Error updating resume')

        if (profilePic) {
            await Image.deleteOne({ resumeId: _id })
            await Image.create({ resumeId: _id, data: profilePic })
        }

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