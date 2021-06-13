"use strict";
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config()

// async..await is not allowed in global scope, must use a wrapper
async function main() {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.host,
    port: process.env.port,
    secure: false, // true for 465, false for other ports
    tls: {
      ciphers: 'SSLv3'
    },
    auth: {
      user: process.env.user,
      pass: process.env.pass,
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: "target@example.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });

  console.log("Message sent: %s", info.messageId);
}

main().catch(console.error);