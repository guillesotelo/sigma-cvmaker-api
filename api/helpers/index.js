const dotenv = require('dotenv')
dotenv.config()
const crypto = require('crypto');
const ENC = 'bf3c199c2470cb477d907b1e0917c17b';
const IV = "5183666c72eec9e4";
const ALGO = "aes-256-cbc"
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = process.env

const encrypt = text => {
    let cipher = crypto.createCipheriv(ALGO, ENC, IV);
    let encrypted = cipher.update(text.toString(), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

const decrypt = text => {
    let decipher = crypto.createDecipheriv(ALGO, ENC, IV);
    let decrypted = decipher.update(text, 'base64', 'utf8');
    return (decrypted + decipher.final('utf8'));
}

const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization']
    if (bearerHeader) {
        const bearerToken = bearerHeader.split(' ')[1]
        jwt.verify(bearerToken, JWT_SECRET, (error, data) => {
            if (error) return res.sendStatus(403)
            next()
        })
    } else res.sendStatus(403)
}

const calculateStringSize = data => {
    const size = new TextEncoder().encode(data || ' ').length || 0
    return Number(size)
}

module.exports = {
    encrypt,
    decrypt,
    verifyToken,
    calculateStringSize
}