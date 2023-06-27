require('dotenv').config();

const express = require('express');
const dns = require('dns');
const cors = require('cors');
const bodyPparser = require("body-parser");
const mongoose = require('mongoose');


const app = express();
app.use(bodyPparser.urlencoded({ extended: false }));
app.use(bodyPparser.json());

// Basic Configuration
const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
const urlSchema = mongoose.Schema({
  original_url: String,
  short_url: Number,
})
const URL = mongoose.model('URL', urlSchema);


app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});
app.post('api/shorturl', (req, res) => {
  const { url } = req.body;

  dns.lookup(url, (err) => {
    if (err) {
      res.json({ error: 'invalid url' });
    } else {
      URL.findOne({ original_url: url })
        .then((result) => {
          if (result) {
            res.json({ original_url: url, short_url: result.short_url });
          } else {
            const shortURL = Math.floor(Math.random() * 10000) + 1;

            const newURL = new URL({ original_url: url, short_url: shortURL });
            newURL.save()
              .then(() => {
                res.json({ original_url: url, short_url: shortURL });
              })
              .catch((error) => {
                console.error(error);
                res.status(500).json({ error: 'An error occurred while saving the URL' });
              });
          }
        })
        .catch((error) => {
          console.error(error);
          res.status(500).json({ error: 'An error occurred while querying the database' });
        });
    }
  });
});

app.get('api/shorturl/:shorturl', (req, res) => {
  const shortURL = req.params.shorturl;

  URL.findOne({ short_url: shortURL })
    .then((result) => {
      if (result) {
        // Redirect the user to the original URL
        res.redirect(result.original_url);
      } else {
        res.json({ error: 'short URL not found' });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while querying the database' });
    });
});


app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

