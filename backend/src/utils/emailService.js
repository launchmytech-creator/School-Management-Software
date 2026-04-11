const nodemailer = require("nodemailer");
const config = require("../config");
const logger = require("./logger");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure, // true for 465, false for 587
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  async sendMail({ to, subject, html, text, fromName }) {
    const mailOptions = {
      from: `"${fromName || config.email.fromName}" <${config.email.from}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // fallback plain text
    };

    const info = await this.transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}`, { messageId: info.messageId });
    return info;
  }

  async verifyConnection() {
    return this.transporter.verify();
  }
}

module.exports = new EmailService();
