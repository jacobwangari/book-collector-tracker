const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { ensureAuth } = require('../middleware/auth');

// Dashboard - User's books
router.get('/dashboard', ensureAuth, async (req, res) => {
    try {
        const books = await Book.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .lean();

        // Calculate stats
        const totalBooks = books.length;
        const genreCounts = {};
        books.forEach(book => {
            genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
        });

        res.render('dashboard', {
            title: 'My Collection',
            books,
            totalBooks,
            genreCount: Object.keys(genreCounts).length,
            username: req.user.username
        });
    } catch (err) {
        console.error(err);
        res.render('error', { error: 'Failed to load dashboard' });
    }
});

// Add book form
router.get('/add', ensureAuth, (req, res) => {
    res.render('add-book', {
        title: 'Add New Book',
        genres: ['Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 
                 'Sci-Fi', 'Fantasy', 'Biography', 'Self-Help', 'History', 'Other']
    });
});

// Create book
router.post('/', ensureAuth, async (req, res) => {
    try {
        const { title, author, genre, isbn, publicationYear, notes } = req.body;

        // Validation
        if (!title || !author || !genre) {
            req.flash('error_msg', 'Please fill in required fields');
            return res.redirect('/books/add');
        }

        await Book.create({
            title,
            author,
            genre,
            isbn,
            publicationYear,
            notes,
            user: req.user.id
        });

        req.flash('success_msg', 'Book added successfully');
        res.redirect('/books/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to add book');
        res.redirect('/books/add');
    }
});

// Edit book form
router.get('/:id/edit', ensureAuth, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).lean();

        if (!book) {
            req.flash('error_msg', 'Book not found');
            return res.redirect('/books/dashboard');
        }

        // Check ownership
        if (book.user.toString() !== req.user.id) {
            req.flash('error_msg', 'Not authorized');
            return res.redirect('/books/dashboard');
        }

        res.render('edit-book', {
            title: 'Edit Book',
            book,
            genres: ['Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 
                     'Sci-Fi', 'Fantasy', 'Biography', 'Self-Help', 'History', 'Other']
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Book not found');
        res.redirect('/books/dashboard');
    }
});

// Update book
router.put('/:id', ensureAuth, async (req, res) => {
    try {
        let book = await Book.findById(req.params.id);

        if (!book) {
            req.flash('error_msg', 'Book not found');
            return res.redirect('/books/dashboard');
        }

        // Check ownership
        if (book.user.toString() !== req.user.id) {
            req.flash('error_msg', 'Not authorized');
            return res.redirect('/books/dashboard');
        }

        const { title, author, genre, isbn, publicationYear, notes } = req.body;

        book = await Book.findByIdAndUpdate(
            req.params.id,
            { title, author, genre, isbn, publicationYear, notes, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        req.flash('success_msg', 'Book updated successfully');
        res.redirect('/books/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to update book');
        res.redirect('/books/dashboard');
    }
});

// Delete book
router.delete('/:id', ensureAuth, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            req.flash('error_msg', 'Book not found');
            return res.redirect('/books/dashboard');
        }

        // Check ownership
        if (book.user.toString() !== req.user.id) {
            req.flash('error_msg', 'Not authorized');
            return res.redirect('/books/dashboard');
        }

        await Book.findByIdAndDelete(req.params.id);

        req.flash('success_msg', 'Book deleted successfully');
        res.redirect('/books/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to delete book');
        res.redirect('/books/dashboard');
    }
});

module.exports = router;