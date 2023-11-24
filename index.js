const express = require('express')
const app = express()
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('AssetPulse Server is Running...')
})

app.listen(port, () => {
  console.log(`AssetPulse Server is Running on port ${port}`)
})