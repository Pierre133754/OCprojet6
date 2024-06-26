const express = require('express');
const mongoose = require("mongoose");
const path = require('path');
require("dotenv").config();
const helmet = require("helmet");

const booksRoutes = require("./routes/books");
const authRoutes = require("./routes/auth");

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_DB)
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(() => console.log('Connexion à MongoDB échouée !'));


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use(helmet({
    crossOriginResourcePolicy: false
}))

app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/images", express.static(path.join(__dirname, "images")));

module.exports = app;