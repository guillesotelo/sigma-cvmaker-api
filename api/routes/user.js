const express = require('express')
const router = express.Router()
const { User } = require('../db/models')
const transporter = require('../helpers/mailer')
const { encrypt, decrypt } = require('../helpers')
const { REACT_APP_URL } = process.env

//User Login
router.post('/', async (req, res, next) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email }).exec()
        if (!user) return res.status(401).json({ message: 'Email already in use' })

        const compareRes = await user.comparePassword(password)
        if (!compareRes) return res.status(401).send('Invalid credentials')

        res.status(200).json({
            username: user.username,
            email: user.email,
            manager: user.manager,
            isManager: user.isManager,
            picture: user.picture || null,
            language: user.language || null
        })

    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create user
router.post('/create', async (req, res, next) => {
    try {
        const { username, email, password, manager, isManager } = req.body

        const emailRegistered = await User.findOne({ email }).exec()
        if (emailRegistered) return res.status(401).send('Email already in use')

        const user = await User.create(req.body)
        if (!user) return res.status(400).send('Bad request')

        await transporter.sendMail({
            from: `"Sigma Resume" <${process.env.EMAIL}>`,
            to: email,
            subject: `Welcome to Sigma CV!`,
            html: `<div style='display: flex; flex-direction: column; align-items: center; margin-top: 3vw; text-align: center;'>
                        <h2>Hello, ${username.split(' ')[0]}!</h2>
                        <h3>Welcome to Sigma CV Maker. <br/>These are your credentials to enter the platform:</h3>
                        <div style="margin:3vw; width:fit-content; padding:1vw 1.5vw; align-self:center; text-align:left; border-radius:8px;box-shadow: 2px 2px 15px lightgray;">
                            <h3>Name: ${username}</h3>
                            <h3>Email: ${email}</h3>
                            <h3>Password: ${password}</h3>
                        </div>
                        <h3>${manager ? `If you have any questions you can ask your manager (${manager})` : ''}</h3>
                        <img src="https://assets.website-files.com/575cac2e09a5a7a9116b80ed/59df61509e79bf0001071c25_Sigma.png" style='width: 120px; margin-top: 4vw; align-self: center;' alt="sigma-logo" border="0"/>
                        <a href='${REACT_APP_URL}/login'><h5 style='margin: 4px;'>Sigma Resume App</h5></a>
                    </div>`
        }).catch((err) => {
            console.error('Something went wrong!', err)
            res.send(500).send('Server Error')
        })

        if (manager) {
            await transporter.sendMail({
                from: `"Sigma Resume" <${process.env.EMAIL}>`,
                to: manager,
                subject: `A new user has been created`,
                html: `<div style='display: flex; flex-direction: column; align-items: center; margin-top: 3vw; text-align: center;'>
                            <h2>Hello!</h2>
                            <h3>A new user has been created with you as the manager.</h3>
                            <div style="margin:3vw; width:fit-content; padding:1vw 1.5vw; align-self:center; text-align:left; border-radius:8px;box-shadow: 2px 2px 15px lightgray;">
                                <h4>User details:</h4>
                                <h3>Name: ${username}</h3>
                                <h3>Email: ${email}</h3>
                                <h3>Password: ${password}</h3>
                                <h3>Manager: ${manager}</h3>
                                <h3>Is Manager: ${isManager ? 'Yes' : 'No'}</h3>
                            </div>
                            <img src="https://assets.website-files.com/575cac2e09a5a7a9116b80ed/59df61509e79bf0001071c25_Sigma.png" style='width: 120px; margin-top: 4vw; align-self: center;' alt="sigma-logo" border="0"/>
                            <a href='${REACT_APP_URL}/login'><h5 style='margin: 4px;'>Sigma Resume App</h5></a>
                        </div>`
            }).catch((err) => {
                console.error('Something went wrong!', err)
                res.send(500).send('Server Error')
            })
        }

        res.status(201).send(`User created successfully`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update User Data
router.post('/update', async (req, res, next) => {
    try {
        const { email, username, currentPass, newEmail, newName } = req.body
        let passwordChanged = false

        if (currentPass) {
            const user = await User.findOne({ email }).exec()
            if (!user) return res.status(401).json({})

            const compareRes = await user.comparePassword(currentPass)
            if (!compareRes) return res.status(401).send('Invalid credentials')
            passwordChanged = true
        }

        const newData = req.body
        if (newName) newData.username = newName

        const newUser = await User.findOneAndUpdate(
            { username, email }, newData, { returnDocument: "after", useFindAndModify: false })
        if (!newUser) return res.status(404).send('Error updating User.')

        if (passwordChanged || newEmail) {
            await transporter.sendMail({
                from: `"Sigma Resume" <${process.env.EMAIL}>`,
                to: email,
                subject: `Your ${passwordChanged ? 'password' : 'email'} has been changed`,
                html: `<div style='margin-top: 3vw; text-align: center;'>
                                <h2>Hello, ${username}!</h2>
                                <h3>Your ${passwordChanged ? 'password' : 'email'} has been changed.</h3>
                                ${passwordChanged ?
                        `<h4>If it wasn't you, please <a href='${REACT_APP_URL}/changePass?userEmail=${encrypt(email)}'>re-generate it</a> to a new one right away, or reply to this email with your registered email and username explaining the issue. We will be responding as soon as possible.</h4>`
                        :
                        `<h4>If it wasn't you, please <a href='${REACT_APP_URL}/login'>login</a> with your new email: ${newEmail}, or reply to this email with your registered email and username explaining the issue. We will be responding as soon as possible.</h4>`
                    }
                                <img src="https://assets.website-files.com/575cac2e09a5a7a9116b80ed/59df61509e79bf0001071c25_Sigma.png" style='height: 30px; width: auto; margin-top: 4vw;' alt="sigma-logo" border="0">
                                <a href='${REACT_APP_URL}/login'><h5 style='margin: 4px;'>Sigma Resume App</h5></a>
                            </div>`
            }).catch((err) => {
                console.error('Something went wrong!', err)
                res.send(500).send('Server Error')
            })
        }

        res.status(200).json({
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            isManager: newUser.isManager,
            language: newUser.language
        })
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

router.post('/changePass', async (req, res, next) => {
    try {
        const { userEmail, password, currentPass } = req.body
        if (!userEmail) res.send(404).send('Wrong parameters')

        const email = decrypt(userEmail)

        const userData = await User.findOne({ email })
        if (!userData) return res.status(404).send('Email not found.')

        const compareRes = await userData.comparePassword(currentPass)
        if (!compareRes) return res.status(401).send('Invalid credentials')

        const updatedUser = await User.findOneAndUpdate(
            { email }, { password }, { returnDocument: "after", useFindAndModify: false })
        if (!updatedUser) return res.status(404).send('Error updating User.')

        await transporter.sendMail({
            from: `"Sigma Resume" <${process.env.EMAIL}>`,
            to: email,
            subject: 'Your password has been changed',
            html: `<div style='margin-top: 3vw; text-align: center;'>
                            <h2>Hello, ${userData.username}!</h2>
                            <h3>Your password has been changed.</h3>
                            <h4>If it wasn't you, please <a href='${REACT_APP_URL}/changePass?userEmail=${userEmail}'>re-generate it</a> to a new one right away, or reply to this email with your registered email and username.</h4>
                            <img src="https://assets.website-files.com/575cac2e09a5a7a9116b80ed/59df61509e79bf0001071c25_Sigma.png" style='height: 30px; width: auto; margin-top: 4vw;' alt="sigma-logo" border="0">
                            <a href='${REACT_APP_URL}/login'><h5 style='margin: 4px;'>CtrlShift App</h5></a>
                        </div>`
        }).catch((err) => console.error('Something went wrong!', err))

        res.status(200).json({ messsage: 'Password updated successfully' })

    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

router.post('/resetByEmail', async (req, res, next) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email }).exec()
        if (!user) return res.status(404).json('Email not found.')

        await transporter.sendMail({
            from: `"Sigma Resume" <${process.env.EMAIL}>`,
            to: email,
            subject: 'Password Reset',
            html: `<div style='margin-top: 3vw; text-align: center;'>
                        <h2>Hello, ${user.username}!</h2>
                        <h3>Click <a href='${REACT_APP_URL}/changePass?userEmail=${encrypt(email)}'>here</a> to reset your password.</h3>
                        <img src="https://assets.website-files.com/575cac2e09a5a7a9116b80ed/59df61509e79bf0001071c25_Sigma.png" style='height: 30px; width: auto; margin-top: 4vw;' alt="sigma-logo" border="0">
                        <h5 style='margin: 4px;'>CtrlShift Team</h5>
                    </div>`
        }).catch((err) => console.error('Something went wrong!', err))

        res.status(200).json({})
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Logout
router.get("/logout", (req, res, next) => {
    req.user = null;
    res.status(200).json({});
})

module.exports = router