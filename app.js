"use strict";
const express = require("express");
const path = require('path');
const favicon = require('serve-favicon')
const bodyParser = require('body-parser');

const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const swig = require('swig');
const nodemailer = require("nodemailer");

const dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = 5000;

app.use(favicon(path.join(__dirname, 'assets', 'lunch.ico')))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// This is where all the magic happens!
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// Swig will cache templates for you, but you can disable
// that and use Express's caching instead, if you like:
app.set('view cache', false);
// To disable Swig's cache, do the following:
swig.setDefaults({ cache: false });
// NOTE: You should always cache templates in a production environment.
// Don't leave both of these to `false` in production!

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/formulaire', (req, res) => {
  res.render('formulaire');
});

app.post('/formulaire', (req, res) => {
  sendMail(req, res);
  res.render('formulaire', { message: "Message sent" });
});

app.use(function(req, res) {
  res.redirect('/');
});

/*** OAUTH ***/

const myOAuth2Client = new OAuth2(
  process.env.clientId,
  process.env.clientSecret,
  process.env.redirectUri
);

myOAuth2Client.setCredentials({
  refresh_token: process.env.refreshToken
});

const myAccessToken = myOAuth2Client.getAccessToken();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.user,
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    refreshToken: process.env.refreshToken,
    accessToken: myAccessToken //access token variable we defined earlier
  }
});

/*** SEND MAIL ***/
function sendMail(req, res) {
  console.log(req.body);

  const { to } = req.body;
  const choices = mockFormData;

  res.render(
    'email',
    {
      choices: choices,
      finalChoice: 'PIZZA'
    },
    (err, htmlMail) => {
    // send mail with defined transport object
    transporter.sendMail({
      from: process.env.user,
      to: to,
      subject: "LunchMailer - le choix du jour",
      html: htmlMail,
    }, 
    (err, info) => {
      if (err) {
        console.log(err);
      }

      res.status(200).send();
    });
  });
}

const mockFormData = [
  {
    name: 'Srivatsan',
    choice: 'Chinois'
  },
  {
    name: 'Adrien',
    choice: 'Italien'
  },
  {
    name: 'Karen',
    choice: 'Italien'
  },
  {
    name: 'Laurent',
    choice: 'Boulangerie'
  },
  {
    name: 'Eric',
    choice: 'Chinois'
  },
  {
    name: 'Marine',
    choice: 'Boulangerie'
  }
];
