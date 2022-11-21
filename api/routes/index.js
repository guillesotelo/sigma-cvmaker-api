const express = require('express')
const router = express.Router()

const userRoutes = require('./user')
const resumeRoutes = require('./resume')
const reportRoutes = require('./report')

router.use('/resume', resumeRoutes)
router.use('/user', userRoutes)
router.use('/report', reportRoutes)

// router.get('/', async (req, res, next) => {
//     res.send('Sigma CV Maker API')
// })

module.exports = router