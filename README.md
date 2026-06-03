# Stay-Hub

Stay-Hub is a full-stack web application for discovering, creating, and managing rental property listings.  
It provides a clean listing experience with image support, validations, and structured routing using MVC patterns.

---

## Features

- View all property listings
- View detailed page for each listing
- Create new listings
- Edit existing listings
- Delete listings
- Server-side schema validation
- Error handling with custom middleware/utilities
- Cloud-based image configuration support

---

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Templating Engine:** EJS
- **File/Image Handling:** Cloudinary configuration
- **Validation:** Joi/schema-based validation
- **Method Override:** Support for PUT/DELETE from forms
- **Static Assets:** Express static middleware

---

## Project Structure

```bash
Stay-Hub/
├── controllers/        # Route controller logic
├── init/               # Initial seed/setup scripts
├── models/             # Mongoose models
├── public/             # Static assets (CSS, JS, images)
├── routes/             # Express route definitions
├── utils/              # Utility helpers (error wrappers, etc.)
├── views/              # EJS templates
├── app.js              # Main application entry point
├── cloudConfig.js      # Cloudinary/storage configuration
├── middleware.js       # Custom middleware
├── schema.js           # Joi/schema validations
├── package.json
└── README.md
```

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sathvik-prasad-m/Stay-Hub.git
   cd Stay-Hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the project root and add required environment variables (see below).

4. **Start the server**
   ```bash
   node app.js
   ```
   or (if configured):
   ```bash
   npm start
   ```

---

## Environment Variables

Create a `.env` file and configure values similar to:

```env
ATLASDB_URL=your_mongodb_connection_string
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
SECRET=your_session_secret
```

> Use the exact variable names expected by your codebase.

---

## Run the Project

After starting the server, open:

```bash
http://localhost:8080
```

(Use the port configured in your `app.js` if different.)

---

## Main Routes Overview

> Base routes may vary slightly based on your current route files.

- `GET /` – Home / landing redirect
- `GET /listings` – Show all listings
- `GET /listings/new` – Form to create listing
- `POST /listings` – Create listing
- `GET /listings/:id` – Listing details
- `GET /listings/:id/edit` – Edit listing form
- `PUT /listings/:id` – Update listing
- `DELETE /listings/:id` – Delete listing

If authentication/review routes are enabled, they will be available under their respective route groups.

---
