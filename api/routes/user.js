const express = require('express')
const router = express.Router()
const { User, Image, Log } = require('../db/models')
const transporter = require('../helpers/mailer')
const { encrypt, decrypt } = require('../helpers')
const { REACT_APP_URL } = process.env

//User Login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email }).exec()
        if (!user) return res.status(401).json({ message: 'Email not found' })

        const compareRes = await user.comparePassword(password)
        if (!compareRes) {
            await Log.create({
                ...req.body,
                details: `Failed login attempt`,
                module: 'User',
                itemId: user._id || null
            })
            return res.status(401).send('Invalid credentials')
        }

        await Log.create({
            ...req.body,
            details: `New login`,
            module: 'User',
            itemId: user._id || null
        })

        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            manager: user.manager,
            isManager: user.isManager,
            language: user.language || null
        })

    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new user / register
router.post('/create', async (req, res, next) => {
    try {
        const { username, email, password, manager, isManager, profilePic } = req.body

        const emailRegistered = await User.findOne({ email }).exec()
        if (emailRegistered) return res.status(401).send('Email already in use')

        const user = await User.create(req.body)
        if (!user) return res.status(400).send('Bad request')

        if (user && profilePic) {
            await Image.create({
                email,
                data: profilePic.profileImage,
                style: profilePic.style ? JSON.stringify(profilePic.style) : ''
            })
        }

        await Log.create({
            ...req.body,
            details: `New user created`,
            module: 'User',
            itemId: user._id || null
        })

        await transporter.sendMail({
            from: `"Sigma Resume" <${process.env.EMAIL}>`,
            to: email,
            subject: `Welcome to Sigma CV!`,
            html: `<table style='margin: auto; color: rgb(51, 51, 51);'>
                        <tbody>
                            <tr>
                                <td style='align-items: center; margin: 3vw auto; text-align: center;'>
                                    <h2>Hello, ${username.split(' ')[0]}!</h2>
                                    <h3>Welcome to Sigma CV Maker. <br/>These are your credentials to enter the platform:</h3>
                                    <div style='margin: 3vw auto; padding: 1vw 1.5vw; text-align:left; border: 1px solid lightgray; border-radius:8px;box-shadow: 2px 2px 15px lightgray;'>
                                        <h3>Name: ${username}</h3>
                                        <h3>Email: ${email}</h3>
                                        <h3>Password: ${password}</h3>
                                    </div>
                                    <h3>${manager ? `If you have any questions you can ask your manager (${manager})` : ''}</h3>
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

        if (manager) {
            await transporter.sendMail({
                from: `"Sigma Resume" <${process.env.EMAIL}>`,
                to: manager,
                subject: `A new user has been created`,
                html: `<table style='margin: auto; color: rgb(51, 51, 51);'>
                            <tbody>
                                <tr>
                                    <td style='align-items: center; margin: 3vw auto; text-align: center;'>
                                        <h2>Hello!</h2>
                                        <h3>A new user has been created with you as the manager.</h3>
                                        <div style='margin: 3vw auto; padding: 1vw 1.5vw; text-align:left; border: 1px solid lightgray; border-radius:8px;box-shadow: 2px 2px 15px lightgray;'>
                                            <h3 style='text-align: center;'>User details</h3>
                                            <h3>Name: ${username}</h3>
                                            <h3>Email: ${email}</h3>
                                            <h3>Password: ${password}</h3>
                                            <h3>Manager: ${manager}</h3>
                                            <h3>Is Manager: ${isManager ? 'Yes' : 'No'}</h3>
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

        res.status(201).send(`User created successfully`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update User Data
router.post('/update', async (req, res, next) => {
    try {
        const { _id, newData, profilePic } = req.body

        const newUser = await User.findByIdAndUpdate(_id, newData, { returnDocument: "after", useFindAndModify: false })
        if (!newUser) return res.status(404).send('Error updating User')

        if (profilePic && profilePic.profileImage) {
            await Image.deleteOne({ email: newData.email })
            await Image.create({
                email: newData.email,
                data: profilePic.profileImage,
                style: profilePic.style ? JSON.stringify(profilePic.style) : ''
            })
        }

        await Log.create({
            ...req.body,
            details: `User updated`,
            module: 'User',
            itemId: newUser._id || null
        })

        res.status(200).json({
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            manager: newUser.manager,
            isManager: newUser.isManager,
            language: newUser.language || null
        })
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get all users
router.get('/getAll', async (req, res, next) => {
    try {
        const { email } = req.query
        const user = await User.findOne({ email }).exec()

        if (user && user.isManager) {
            const users = await User.find().select('-password').sort({ username: 1 })
            if (!users) return res.status(404).send('No users found')

            res.status(200).json(users)
        } else res.status(403).send('User does not have the required permission')
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get Profile Image by User ID
router.get('/getProfileImage', async (req, res, next) => {
    try {
        const { email } = req.query
        const profileImage = await Image.findOne({ email }).exec()
        if(!profileImage) return res.status(404).send('Pofile Image not found')
        res.status(200).json(profileImage)

    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Change user password
router.post('/changePass', async (req, res, next) => {
    try {
        const { userEmail, password, currentPass } = req.body
        if (!userEmail) res.send(404).send('Wrong parameters')

        const email = decrypt(userEmail)

        const userData = await User.findOne({ email })
        if (!userData) return res.status(404).send('Email not found')

        const compareRes = await userData.comparePassword(currentPass)
        if (!compareRes) return res.status(401).send('Invalid credentials')

        const updatedUser = await User.findOneAndUpdate(
            { email }, { password }, { returnDocument: "after", useFindAndModify: false })
        if (!updatedUser) return res.status(404).send('Error updating User')

        await Log.create({
            ...req.body,
            email,
            details: `User password updated`,
            module: 'User',
            itemId: updatedUser._id || null
        })

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

//Send Email to reset password
router.post('/resetByEmail', async (req, res, next) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email }).exec()
        if (!user) return res.status(404).json('Email not found')

        await Log.create({
            ...req.body,
            email,
            details: `Sent email for password recover`,
            module: 'User',
            itemId: user._id || null
        })

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

//Check if it's admin user
router.get('/admin', async (req, res, next) => {
    try {
        const { email } = req.query

        const user = await User.findOne({ email }).exec()
        if (!user) return res.status(401).send('Email not found')

        res.status(200).json({
            isAdmin: user.isAdmin || false
        })

    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Remove User
router.post('/remove', async (req, res, next) => {
    try {
        const { email, userData } = req.body

        const user = await User.findOne({ email }).exec()
        if (!user) return res.status(401).send('Email not found')

        if (user.isManager) {
            const removed = await User.deleteOne({ email: userData.email }).exec()
            return res.status(200).json(removed)
        }

        res.status(404).send('Error deleting user')
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Logout
router.get("/logout", async (req, res, next) => {
    req.user = null

    await Log.create({
        ...req.body,
        details: `User logged out`,
        module: 'User'
    })

    res.status(200).json({})
})

module.exports = router