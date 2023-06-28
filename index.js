require('dotenv').config();

const express = require('express');
const dns = require('dns');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Basic Configuration
const port = process.env.PORT || 3000;

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    throw err;
  }
};

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error: '));
db.once('open', function () {
  console.log('Connected successfully');
});

app.use(cors());

const urlSchema = mongoose.Schema({
  original_url: String,
  short_url: Number,
});
const URL = mongoose.model('URL', urlSchema);

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;

  try {
    await dns.promises.lookup(url);

    const result = await URL.findOne({ original_url: url });

    if (result) {
      res.json({ original_url: url, short_url: result.short_url });
    } else {
      const shortURL = Math.floor(Math.random() * 10000) + 1;
      const newURL = new URL({ original_url: url, short_url: shortURL });

      await newURL.save();

      res.json({ original_url: url, short_url: shortURL });
    }
  } catch (error) {
    console.error(error);
    res.json({ error: 'Invalid URL' });
  }
});

// app.get('/api/shorturl/:shorturl', async (req, res) => {
//   const shortURL = req.params.shorturl;

//   try {
//     const result = await URL.findOne({ short_url: shortURL });

//     if (result) {
//       res.redirect(result.original_url);
//     } else {
//       res.json({ error: 'Short URL not found' });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'An error occurred while querying the database' });
//   }
// });
app.get('/api/shorturl/:shorturl', async (req, res) => {
  const shortURL = req.params.shorturl;

  try {
    const result = await URL.findOne({ short_url: shortURL });

    if (result) {
      res.redirect(result.original_url);
      console.log(result.original_url);
    } else {
      res.status(404).json({ error: 'Short URL not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while querying the database' });
  }
});


connect().catch(console.error);

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
