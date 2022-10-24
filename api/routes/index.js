const express = require('express')
const router = express.Router()

const userRoutes = require('./user')
const resumeRoutes = require('./resume')

router.use('/resume', resumeRoutes)
router.use('/user', userRoutes)

module.exports = router