const dotenv = require('dotenv')
const express = require('express')
const router = express.Router()

const userRoutes = require('./user')
const resumeRoutes = require('./resume')
const reportRoutes = require('./report')
const logRoutes = require('./log')
const appDataRoutes = require('./appData')
const imageRoutes = require('./image')
const { verifyToken } = require('../helpers')
dotenv.config()

router.use('/resume', verifyToken, resumeRoutes)
router.use('/user', userRoutes)
router.use('/report', verifyToken, reportRoutes)
router.use('/log', verifyToken, logRoutes)
router.use('/app', verifyToken, appDataRoutes)
router.use('/image', verifyToken, imageRoutes)

module.exports = router, verifyToken