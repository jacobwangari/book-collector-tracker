# 📚 BookTrack

A personal book collection tracker built with Node.js, Express, and MongoDB. Users can register, verify their email, log in (locally or with Google), and manage their own library with full CRUD functionality. A public-facing library page lets anyone browse and search the shared community catalog without needing an account.

**Live Site:** [https://book-collector-tracker.onrender.com](https://book-collector-tracker.onrender.com)
**GitHub Repository:** [https://github.com/jacobwangari/book-collector-tracker](https://github.com/your-username/book-collector-tracker)

---

## 📖 About

BookTrack is a digital library for book lovers who want a searchable, organized record of what they own or have read. Instead of forgetting which books are already on the shelf, users can log title, author, genre, and personal notes for each book — and manage their whole collection through a clean dashboard.

---

## ✨ Features

### Core Functionality
- **Full CRUD** — Create, read, update, and delete books in a personal collection
- **User authentication** — Register and log in with email/password, or sign in with Google
- **Email verification** — New accounts must verify their email address before logging in, confirming the user owns a real, working email
- **Forgot password** — Self-service password reset via a secure, time-limited email link
- **Public library** — A read-only page showing every book added by every user, viewable without an account
- **Delete confirmation** — Prevents accidental data loss with a confirmation step before deleting a book

### Additional Feature: Public Search & Filter
Visitors to the public library (no account required) can search and filter the entire community catalog:
- Free-text search across title and author (case-insensitive, partial match)
- Filter by genre
- Filter by author
- Filters can be combined and are reflected in the URL as query parameters

This was implemented using Mongoose's `$regex` for text search and `distinct()` to dynamically populate the genre/author filter dropdowns from whatever data actually exists in the database.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Templating | Handlebars (HBS) |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | Passport.js (Local Strategy + Google OAuth 2.0) |
| Session Store | connect-mongo |
| Password Hashing | bcrypt.js |
| Email | Nodemailer (Gmail SMTP) |
| Styling | Bootstrap 5 + custom CSS |
| Icons | Font Awesome |
| Deployment | Render |

---

## 🗂️ Project Structure

```
book-collector-tracker/
├── app.js                  # Application entry point
├── config/
│   ├── database.js         # MongoDB connection
│   ├── passport.js         # Passport strategies (Local + Google)
│   └── mailer.js           # Nodemailer email functions
├── middleware/
│   └── auth.js             # ensureAuth / ensureGuest route guards
├── models/
│   ├── User.js              # User schema
│   └── Book.js              # Book schema
├── routes/
│   ├── index.js              # Home page + public library/search
│   ├── auth.js                # Register, login, verify, reset password, OAuth
│   └── books.js               # CRUD routes for books (protected)
├── views/
│   ├── layouts/main.hbs
│   ├── partials/ (header, footer)
│   └── *.hbs                    # Page templates
├── public/
│   ├── css/styles.css
│   └── js/search.js
└── .env                            # Environment variables (not committed)
```

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- Node.js (v16+)
- A MongoDB Atlas account (free tier is enough)
- A Google Cloud project (for OAuth login)
- A Gmail account with an App Password (for sending verification/reset emails)

### 1. Clone the repository
```bash
git clone https://github.com/jacobwangari/book-collector-tracker.git
cd book-collector-tracker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a `.env` file in the project root
```env
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=a_long_random_string

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

EMAIL_USER=youraddress@gmail.com
EMAIL_APP_PASSWORD=your_16_character_gmail_app_password

APP_URL=http://localhost:3000
PORT=3000
```

> See **Environment Variables** below for how to obtain each of these values.

### 4. Run the app
```bash
npm run dev     # with nodemon (auto-restart on changes)
# or
npm start       # plain node
```

Visit **http://localhost:3000**

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | Connection string from MongoDB Atlas |
| `SESSION_SECRET` | Random string used to sign session cookies. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth Client ID |
| `GOOGLE_CALLBACK_URL` | Must exactly match a URI registered in Google Cloud Console (e.g. `http://localhost:3000/auth/google/callback` locally, or your Render URL in production) |
| `EMAIL_USER` | The Gmail address emails are sent from |
| `EMAIL_APP_PASSWORD` | A Gmail **App Password** (not your normal password) — generate at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) after enabling 2-Step Verification |
| `APP_URL` | Base URL used to build verification/reset links in emails |
| `PORT` | Port the app runs on locally (Render sets this automatically in production) |

---

## 🔐 Authentication Flow

1. **Register** with username, email, and password
2. A verification email is sent; the account is inactive until the link is clicked
3. **Login is blocked** for unverified accounts, with an option to resend the verification email
4. Alternatively, users can **sign in with Google** — Google-authenticated accounts are verified automatically since Google has already confirmed the email
5. **Forgot password** sends a time-limited (1 hour) reset link by email; for security, the response is identical whether or not the email is registered, so the form can't be used to enumerate accounts

---

## 📋 CRUD Routes

| Method | Route | Description | Access |
|---|---|---|---|
| GET | `/library` | View & search all books | Public |
| GET | `/books/dashboard` | View own book collection | Private |
| GET | `/books/add` | Add book form | Private |
| POST | `/books` | Create a book | Private |
| GET | `/books/:id/edit` | Edit book form | Private |
| PUT | `/books/:id` | Update a book | Private |
| DELETE | `/books/:id` | Delete a book | Private |

---

## ☁️ Deployment

The app is deployed on **Render** as a Node web service.

1. Push code to GitHub
2. Connect the repository in Render
3. Build command: `npm install`
4. Start command: `node app.js`
5. Add all environment variables from `.env` in the Render dashboard (with production values — e.g. `APP_URL` and `GOOGLE_CALLBACK_URL` pointing at the live Render URL, not localhost)
6. Add the production callback URL to Google Cloud Console's Authorized Redirect URIs

---

## 🧪 Testing Checklist

- [x] Register a new account and confirm verification email is received
- [x] Login is blocked until email is verified
- [x] Login works after verifying
- [x] Login with Google works and skips verification
- [x] Forgot password sends a working, expiring reset link
- [x] Add, edit, and delete a book from the dashboard
- [x] Delete requires confirmation
- [x] Public library shows books from all users
- [x] Search and filters work individually and combined
- [x] Non-owners cannot edit or delete another user's book

---

## 📝 Notes for Reviewer

- External code used: Passport.js authentication boilerplate patterns adapted from the official [Passport.js documentation](http://www.passportjs.org/) (local and Google OAuth 2.0 strategies). All code was reviewed, adapted to this project's schema, and commented.

---

## 🙏 Acknowledgments

- Bootstrap for the responsive UI framework
- Font Awesome for icons
- MongoDB Atlas for free-tier database hosting
- Render for free-tier deployment
- Passport.js for authentication strategies

---

**Built by [jacmwas](https://my-portifolio-tau-rosy.vercel.app/)**