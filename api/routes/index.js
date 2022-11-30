const express = require('express')
const router = express.Router()

const userRoutes = require('./user')
const resumeRoutes = require('./resume')
const reportRoutes = require('./report')
const logRoutes = require('./log')
const appDataRoutes = require('./appData')

router.use('/resume', resumeRoutes)
router.use('/user', userRoutes)
router.use('/report', reportRoutes)
router.use('/log', logRoutes)
router.use('/app', appDataRoutes)

// router.get('/', async (req, res, next) => {
//     res.send('Sigma CV Maker API')
// })

module.exports = router