const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// Home page
router.get('/', (req, res) => {
    res.render('home', {
        title: 'BookTrack - Your Personal Digital Library'
    });
});

// Public library with search
router.get('/library', async (req, res) => {
    try {
        const { q, genre, author } = req.query;
        let query = {};

        // Search functionality
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { author: { $regex: q, $options: 'i' } }
            ];
        }

        if (genre && genre !== 'all') {
            query.genre = genre;
        }

        if (author && author !== 'all') {
            query.author = author;
        }

        const books = await Book.find(query)
            .populate('user', 'username')
            .sort({ createdAt: -1 })
            .lean();

        // Get unique genres and authors for filters
        const allGenres = await Book.distinct('genre');
        const allAuthors = await Book.distinct('author');

        res.render('library', {
            title: 'Public Library',
            books,
            genres: allGenres,
            authors: allAuthors,
            searchQuery: q || '',
            selectedGenre: genre || 'all',
            selectedAuthor: author || 'all'
        });
    } catch (err) {
        console.error(err);
        res.render('error', { error: 'Failed to load library' });
    }
});

module.exports = router;