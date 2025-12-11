import nodemailer from "nodemailer";
import config from "../../config";

const emailSender = async (to: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: config.emailSender.email,
      pass: config.emailSender.app_pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  await transporter.sendMail({
    from: `"TravelBuddy" <${config.emailSender.email}>`,
    to,
    subject,
    html,
  });
};

export default emailSender;
