const nodemailer = require('nodemailer');
const { welcomeEmail, userUpdateEmail, passwordUpdateEmail, resetPasswordEmail } = require('./emailTemplates');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify().then(() => {
  console.log("* Mailing ready *")
})

const sendWelcomeEmail = async (username, password, to) => {
  await transporter.sendMail({
    from: `"Sigma CV" <${process.env.EMAIL}>`,
    to,
    subject: `Welcome to Sigma CV App`,
    html: welcomeEmail(username, to, password)
  }).catch((err) => {
    console.error('Something went wrong!', err)
  })
}

const sendDataUpdateEmail = async (username, password, to) => {
  await transporter.sendMail({
    from: `"Sigma CV" <${process.env.EMAIL}>`,
    to,
    subject: `Your data has been updated`,
    html: userUpdateEmail(username, to, password)
  }).catch((err) => {
    console.error('Something went wrong!', err)
  })
}

const sendPasswordUpdateEmail = async (username, encryptedEmail, to) => {
  await transporter.sendMail({
    from: `"Sigma CV" <${process.env.EMAIL}>`,
    to,
    subject: `Your password has been changed`,
    html: passwordUpdateEmail(username, encryptedEmail)
  }).catch((err) => {
    console.error('Something went wrong!', err)
  })
}

const sendPasswordResetEmail = async (username, encryptedEmail, to) => {
  await transporter.sendMail({
    from: `"Sigma CV" <${process.env.EMAIL}>`,
    to,
    subject: `Password reset`,
    html: resetPasswordEmail(username, encryptedEmail)
  }).catch((err) => {
    console.error('Something went wrong!', err)
  })
}

module.exports = {
  transporter,
  sendWelcomeEmail,
  sendDataUpdateEmail,
  sendPasswordUpdateEmail,
  sendPasswordResetEmail
};