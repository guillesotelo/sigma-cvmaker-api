const express = require("express")
const morgan = require("morgan")
const cors = require('cors')
const { connection } = require("./api/db")
const routes = require("./api/routes")
const app = express()

app.use(cors({
  origin: 'https://sigma-cvmaker.vercel.app',
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}))
app.use(morgan("dev"))

// app.use(express.json())
// app.use(express.urlencoded({ extended: true }))

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true, parameterLimit: 1000000 }));

app.use("/api", routes)

app.use((err, _, res, __) => {
  console.error(err.stack)
  res.status(500).send("Something broke!")
})

const PORT = process.env.PORT || 5000

// if(process.env.NODE_ENV === 'production') {
//   app.use(express.static('build'))
//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'build', 'index.html'))
//   })
// }

connection.on("error", console.error.bind("Connection error: ", console))

connection.once("open", () => {
  console.log("* Conected successfully to DB *")
  app.listen(PORT, () => console.log("* Server listening... *"))
})

module.exports = app