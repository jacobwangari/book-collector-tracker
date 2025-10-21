const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    genre: {
        type: String,
        required: true,
        enum: ['Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 
               'Sci-Fi', 'Fantasy', 'Biography', 'Self-Help', 'History', 'Other']
    },
    isbn: {
        type: String,
        trim: true
    },
    publicationYear: {
        type: Number,
        min: 1000,
        max: new Date().getFullYear() + 1
    },
    notes: {
        type: String,
        trim: true
    },
    coverImage: {
        type: String // URL or file path
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
BookSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Book', BookSchema);