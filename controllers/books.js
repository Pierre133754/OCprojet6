const Book = require("../models/Book");
const fs = require("fs");

exports.postBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book)
    delete bookObject._id
    delete bookObject.userId
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
    })

    book.save()
    .then(() => {res.status(201).json({ message: "Livre enregistré"})})
    .catch(error => {res.status(400).json({ error })});
};

exports.getBooks = (req, res, next) => {
    Book.find()
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};

exports.getBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json(book))
    .catch(error => res.status(404).json({ error }));
};

exports.getTop3 = (req, res, next) => {
    Book.find().sort("-averageRating").limit(3)
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};

exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
    } : { ...req.body };
    delete bookObject.userId;
    
    Book.findOne({ _id: req.params.id })
    .then(book => {
        if (book.userId != req.auth.userId) {
            res.status(401).json({ message: "Non autorisé " })
        } else {
            /* remove old image if changing it */
            if (req.file) {
                const filename = book.imageUrl.split("/images/")[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: "Livre modifié" }))
                    .catch(error => res.status(400).json({ error }));
                })
            } else {
                Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id })
                .then(() => res.status(200).json({ message: "Livre modifié" }))
                .catch(error => res.status(400).json({ error }));
            }
        }
    })
    .catch(error => res.status(400).json({ error }));
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
    .then(book => {
        if (book.userId != req.auth.userId) {
            res.status(401).json({ message: "Non autorisé" })
        } else {
            const filename = book.imageUrl.split("/images/")[1];
            fs.unlink(`images/${filename}`, () => {
                Book.deleteOne({ _id: req.params.id })
                .then(() => res.status(200).json({ message: "Livre supprimé" }))
                .catch(error => res.status(400).json({ error }));
            })
        }
    })
    .catch(error => res.status(500).json({ error }));
};

exports.rateBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
    .then(book => {
        if ( book.ratings.find(rating => rating.userId === req.auth.userId) ) {   
            res.status(401).json({ message: "vous avez deja noté le livre" })   
        } else {
            book.ratings.push({
                userId: req.auth.userId,
                grade: req.body.rating
            })
            var sum = 0;
            var count = 0;
            book.ratings.forEach(rating => {
                if (!isNaN(rating.grade)) {
                    sum += rating.grade
                    count++
                }
            })
            book.averageRating = sum / count;
            Book.updateOne({ _id: req.params.id }, book)
            .then(() => res.status(200).json(book))
            .catch(error => res.status(400).json({ error }));
        }
    })
    .catch(error => res.status(500).json({ error }));
}