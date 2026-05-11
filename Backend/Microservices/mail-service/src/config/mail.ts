import nodemailer from 'nodemailer'

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service:'gmail',
  auth: {
    user: "sameer.manoj2005@gmail.com",
    pass: "gvutlyazwhxaujjy",
  },
});

export default transporter;