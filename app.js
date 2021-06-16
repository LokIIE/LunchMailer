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
const port = process.env.PORT || 5000;

app.use(favicon(path.join(__dirname, 'assets', 'lunch.ico')));
app.use(bodyParser.urlencoded({ extended: true }));

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
  const status = sendMail(req, res);
  // res.render('formulaire', { message: status });
  res.status(204).send();
});

app.get('/mockFormulaire', (req, res) => {
  sendMail(req, res, true);
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
function sendMail(req, res, mockData) {
  let to, choices;
  if (!!mockData) {
    to = process.env.user;
    choices = mockFormData.slice();
  } else {
    to = req.body.to;
    choices = req.body.choices;

    if (!to || !to.trim()) {
      return "Veuillez renseigner un destinataire";
    }
  }

  res.render(
    'email',
    {
      choices: choices,
      counts: formatCounts(computeCounts(choices)),
      finalChoice: computeFinalChoice(choices)
    },
    (err, htmlMail) => {
    // send mail with defined transport object
    transporter.sendMail({
      from: process.env.user,
      to: to.trim(),
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

  return "Message envoyé";
}

function computeCounts(choices) {
  const counts = {};

  for (let i = 0; i < choices.length; i++) {
    const choice = choices[i];
    if (!counts[choice.value]) {
      counts[choice.value] = 1;
    } else {
      counts[choice.value] += 1;
    }
  }

  return counts;
}

function formatCounts(counts) {
  const result = []

  for (let choice in counts) {
    result.push({
      choice,
      value: counts[choice]
    });
  }

  return result;
}

function computeFinalChoice(choices) {
  const counts = computeCounts(choices);
  
  let results = [];
  let maxCount = 0;

  for (let choice in counts) {
    if (counts[choice] > maxCount) {
      maxCount = counts[choice];
      results = [choice];
    } else if (counts[choice] === maxCount) {
      results.push(choice);
    }
  }

  return results.join(' ou ');
}

const mockFormData = [
  {
    name: 'Damien',
    value: 'Chinois'
  },
  {
    name: 'Adrien',
    value: 'Italien'
  },
  {
    name: 'Valentine',
    value: 'Italien'
  },
  {
    name: 'Kevin',
    value: 'Boulangerie'
  },
  {
    name: 'Lucie',
    value: 'Chinois'
  },
];
