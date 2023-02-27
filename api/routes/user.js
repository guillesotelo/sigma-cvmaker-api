const dotenv = require('dotenv')
const express = require('express')
const router = express.Router()
const { User, Image, Log } = require('../db/models')
const transporter = require('../helpers/mailer')
const { encrypt, decrypt } = require('../helpers')
const { REACT_APP_URL } = process.env
const jwt = require('jsonwebtoken')
dotenv.config()
const { JWT_SECRET } = process.env
const { verifyToken } = require('../helpers')

//User Login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email }).exec()
        if (!user) return res.status(401).json({ message: 'Email not found' })

        const compareRes = await user.comparePassword(password)
        if (!compareRes) {
            await Log.create({
                username: user.username || '',
                email: user.email || '',
                details: `Failed login attempt`,
                module: 'User',
                itemId: user._id || null
            })
            return res.status(401).send('Invalid credentials')
        }

        const token = jwt.sign({ sub: user._id }, JWT_SECRET, { expiresIn: '30d' })

        await Log.create({
            username: user.username || '',
            email: user.email || '',
            details: `New login`,
            module: 'User',
            itemId: user._id || null
        })

        const {
            _id,
            updatedAt,
            createdAt,
            username,
            isManager,
            isAdmin,
            phone,
            location,
            managerName,
            managerEmail,
            language,
            removed
        } = user

        res.status(200).json({
            _id,
            updatedAt,
            createdAt,
            username,
            email: user.email,
            isManager,
            isAdmin,
            phone,
            location,
            managerName,
            managerEmail,
            language,
            removed,
            token
        })


    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new user / register
router.post('/create', verifyToken, async (req, res, next) => {
    try {
        const { username, email, password, sendEmail, profilePic, user } = req.body

        const emailRegistered = await User.findOne({ email }).exec()
        if (emailRegistered) return res.status(401).send('Email already in use')

        const newUser = await User.create(req.body)
        if (!newUser) return res.status(400).send('Bad request')

        if (profilePic && profilePic.image) {
            await Image.create({
                name: newUser.username,
                email,
                data: profilePic.image,
                type: 'Profile',
                style: profilePic.style ? JSON.stringify(profilePic.style) : '',
                size: Buffer.byteLength(profilePic.image, 'utf8')
            })
        }

        await Log.create({
            username: user.username || '',
            email: user.email || '',
            details: `New user created: ${newUser.username}`,
            module: 'User',
            itemId: newUser._id || null
        })

        if (sendEmail) {
            await transporter.sendMail({
                from: `"Sigma CV" <${process.env.EMAIL}>`,
                to: email,
                subject: `Welcome to Sigma CV App!`,
                html: `<table style='margin: auto; color: rgb(51, 51, 51);'>
                            <tbody>
                                <tr>
                                    <td style='align-items: center; margin: 3vw auto; text-align: center;'>
                                        <h3 style='font-weight: normal; margin-bottom: 1vw;'>Hello, ${username ? username.split(' ')[0] : ''}!</h3>
                                        <h3 style='font-weight: normal;'>Welcome to Sigma CV Maker. <br/>These are your credentials to enter the platform:</h3>
                                        <div style='margin: 3vw auto; padding: 1vw 1.5vw; text-align:left; border: 1px solid lightgray; border-radius:8px;box-shadow: 2px 2px 15px lightgray;'>
                                            <h3 style='font-weight: normal;'>Name: ${username}</h3>
                                            <h3 style='font-weight: normal;'>Email: ${email}</h3>
                                            <h3 style='font-weight: normal; color: #cccccc;'>Password: ${password}</h3>
                                        </div>
                                        <img src="https://sigmait.pl/wp-content/uploads/2021/12/sigma-logo-black.png" style='width: 120px; margin-top: 3vw; align-self: center;' alt="sigma-logo" border="0"/>
                                        <h5 style='margin: 4px;'><a style='text-decoration: none;' href='${REACT_APP_URL}'>Sigma CV App<a/></h5>
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
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id, newData, profilePic, user, managerUpdate, email } = req.body

        const _user = await User.findOne({ email: user.email }).exec()
        if (!_user || !_user.isManager) return res.status(405).json({ message: 'User does not have the required permission' })

        if (managerUpdate && email) {
            const newUser = await User.findOneAndUpdate({ email }, newData, { returnDocument: "after", useFindAndModify: false }).select('-password')
            if (newUser) return res.status(200).json(newUser)
        }

        const newUser = await User.findByIdAndUpdate(_id, newData, { returnDocument: "after", useFindAndModify: false })
        if (!newUser) return res.status(404).send('Error updating User')

        if (profilePic && profilePic.image) {
            const imageData = {
                name: newUser.name,
                email: newData.email,
                data: profilePic.image,
                type: 'Profile',
                style: profilePic.style ? JSON.stringify(profilePic.style) : '',
                size: Buffer.byteLength(profilePic.image, 'utf8')
            }
            const exists = await Image.findOne({ email: newData.email, type: 'Profile' }).exec()
            if (exists) await Image.findByIdAndUpdate(exists._id, imageData, { useFindAndModify: false })
            else await Image.create(imageData)
        }

        await Log.create({
            username: user.username || '',
            email: user.email || '',
            details: `User updated: ${newUser.username}`,
            module: 'User',
            itemId: _id || null
        })

        if (newData.sendEmail) {
            await transporter.sendMail({
                from: `"Sigma CV" <${process.env.EMAIL}>`,
                to: newUser.email,
                subject: `Your data has been updated`,
                html: `<table style='margin: auto; color: rgb(51, 51, 51);'>
                            <tbody>
                                <tr>
                                    <td style='align-items: center; margin: 3vw auto; text-align: center;'>
                                        <h3 style='font-weight: normal; margin-bottom: 1vw;'>Hello, ${newUser.username ? newUser.username.split(' ')[0] : ''}!</h3>
                                        <h3 style='font-weight: normal;'>Your data has been updated. <br/>These are your credentials to enter the platform:</h3>
                                        <div style='margin: 3vw auto; padding: 1vw 1.5vw; text-align:left; border: 1px solid lightgray; border-radius:8px;box-shadow: 2px 2px 15px lightgray;'>
                                            <h3 style='font-weight: normal;'>Name: ${newUser.username}</h3>
                                            <h3 style='font-weight: normal;'>Email: ${newUser.email}</h3>
                                            <h3 style='font-weight: normal; color: #cccccc;'>Password: ${newUser.password}</h3>
                                        </div>
                                        <img src="https://sigmait.pl/wp-content/uploads/2021/12/sigma-logo-black.png" style='width: 120px; margin-top: 3vw; align-self: center;' alt="sigma-logo" border="0"/>
                                        <h5 style='margin: 4px;'><a style='text-decoration: none;' href='${REACT_APP_URL}'>Sigma CV App<a/></h5>
                                    </td>
                                </tr>
                            </tbody>
                        </table>`
            }).catch((err) => {
                console.error('Something went wrong!', err)
                res.send(500).send('Server Error')
            })
        }

        const token = jwt.sign({ sub: newUser._id }, JWT_SECRET, { expiresIn: '30d' })

        delete newUser.password
        res.status(200).json({ ...newUser._doc, token })
    } catch (err) {
        console.error('Something went wrong!', err)
        return res.send(500).send('Server Error')
    }
})

//Get all users
router.get('/getAll', verifyToken, async (req, res, next) => {
    try {
        const { email } = req.query
        const user = await User.findOne({ email }).exec()

        if (user && user.isManager) {
            const users = await User.find().select('-password').sort({ username: 1 })
            if (!users) return res.status(200).send('No users found')

            res.status(200).json(users)
        } else res.status(403).send('User does not have the required permission')
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get all managers
router.get('/getManagers', verifyToken, async (req, res, next) => {
    try {
        const managers = await User.find({ isManager: true, username: { $ne: 'Admin ' } }).select('-password').sort({ username: 1 })
        if (!managers) return res.status(200).send('No managers found')

        res.status(200).json(managers)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get Profile Image by email
router.get('/getProfileImage', verifyToken, async (req, res, next) => {
    try {
        const { email } = req.query
        const profileImage = await Image.findOne({ email, type: 'Profile', removed: false }).exec()
        if (!profileImage) return res.status(200).send('Pofile Image not found')
        res.status(200).json(profileImage)

    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get Signature by email
router.get('/getSignature', verifyToken, async (req, res, next) => {
    try {
        const { email } = req.query
        const signature = await Image.findOne({ email, type: 'Signature', removed: false }).exec()
        if (!signature) return res.status(200).send('Signature not found')
        res.status(200).json(signature)

    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Change user password
router.post('/changePass', async (req, res, next) => {
    try {
        const { userEmail, password } = req.body
        if (!userEmail) res.send(404).send('Wrong parameters')

        const email = decrypt(userEmail)

        const userData = await User.findOne({ email })
        if (!userData) return res.status(404).send('Email not found')

        const updatedUser = await User.findOneAndUpdate(
            { email }, { password }, { returnDocument: "after", useFindAndModify: false })
        if (!updatedUser) return res.status(404).send('Error updating User')

        await Log.create({
            username: updatedUser.username || '',
            email,
            details: `User password updated: ${updatedUser.username}`,
            module: 'User',
            itemId: updatedUser._id || null
        })

        await transporter.sendMail({
            from: `"Sigma CV App" <${process.env.EMAIL}>`,
            to: email,
            subject: 'Your password has been changed',
            html: `<div style='margin-top: 3vw; text-align: center;'>
                        <h3 style='text-align: left; font-weight: normal; margin-bottom: 1vw;'>Hello, ${userData.username ? userData.username.split(' ')[0] : ''}!</h3>
                        <h3 style='font-weight: normal;'>Your password has been changed.</h3>
                        <h3 style='font-weight: normal;'>If it was a mistake, use <a style='text-decoration: none;' href='${REACT_APP_URL}/changePass?userEmail=${encrypt(userEmail)}'>this link</a> to generate a new one.</h3>
                        <img src="https://sigmait.pl/wp-content/uploads/2021/12/sigma-logo-black.png" style='height: 30px; width: auto; margin-top: 4vw;' alt="sigma-logo" border="0">
                        <h5 style='margin: 4px;'><a style='text-decoration: none;' href='${REACT_APP_URL}'>Sigma CV App<a/></h5>
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
            username: user.username || '',
            email,
            details: `Email sent for password recover`,
            module: 'User',
            itemId: user._id || null
        })

        await transporter.sendMail({
            from: `"Sigma CV App" <${process.env.EMAIL}>`,
            to: email,
            subject: 'Password Reset',
            html: `<div style='margin-top: 3vw; text-align: center;'>
                        <h3 style='text-align: left; font-weight: normal; margin-bottom: 1vw;'>Hello, ${user.username ? user.username.split(' ')[0] : ''}!</h3>
                        <h3 style='font-weight: normal;'>We received a request to update your password.<br/><br/>
                        Click <a style='text-decoration: none;' href='${REACT_APP_URL}/changePass?userEmail=${encrypt(email)}'>here</a> to reset your password.<br/><br/>
                        If it wasn't you, just ignore this email. You are the only one who has permission to change your password.</h3>
                        <img src="https://sigmait.pl/wp-content/uploads/2021/12/sigma-logo-black.png" style='height: 30px; width: auto; margin-top: 4vw;' alt="sigma-logo" border="0">
                        <h5 style='margin: 4px;'><a style='text-decoration: none;' href='${REACT_APP_URL}'>Sigma CV App<a/></h5>
                    </div>`
        }).catch((err) => console.error('Something went wrong!', err))

        res.status(200).json({})
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Check if it's admin user
router.get('/permissions', async (req, res, next) => {
    try {
        const { email } = req.query

        const user = await User.findOne({ email }).exec()
        if (!user) return res.status(401).send('Email not found')

        res.status(200).json({
            isAdmin: user.isAdmin || false,
            isManager: user.isManager || false
        })

    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Remove User
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { email, userData } = req.body

        const user = await User.findOne({ email }).exec()
        if (!user) return res.status(401).send('User not found')

        if (user.isManager) {
            const removed = await User.findOneAndUpdate(
                { email: userData.email },
                { removed: true },
                { returnDocument: "after", useFindAndModify: false }
            )
            if (!removed) return res.status(401).send('Error deleting user')

            const images = await Image.updateMany({ email: userData.email }, { removed: true })

            if (images && images.length) {
                for (let i = 0; i < images.length; i++) {
                    await Log.create({
                        username: user.username || '',
                        email: user.email || '',
                        details: `Image moved to trash: ${images[i].name || images[i].email}`,
                        module: 'Image',
                        itemId: images[i]._id || null
                    })
                }
            }

            await Log.create({
                username: user.username || '',
                email: user.email || '',
                details: `User moved to trash: ${userData.username}`,
                module: 'User',
                itemId: userData._id || null
            })

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

    await Log.create({
        username: req.query.username || '',
        email: req.query.email || '',
        details: `User logged out`,
        module: 'User',
        itemId: req.query._id || null
    })

    res.status(200).json({})
})

module.exports = router