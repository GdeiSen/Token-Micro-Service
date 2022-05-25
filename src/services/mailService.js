const nodemailer = require("nodemailer")
const config = require("../../config.json");
exports.MailService = class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.SMTP_HOST,
            port: config.SMPT_PORT,
            secure: false,
            auth: {
                user: config.SMPT_USER,
                pass: config.SMPT_PASSWORD
            }
        })
    }
    async sendActivationMail(to, link) {
        await this.transporter.sendMail({
            from: config.SMPT_USER,
            to,
            subject: "Account Activation on BAVERIO",
            text: "",
            html:
                `
            <div>
                <h1>For account activation click link below</h1>
                <a href="${link}">${link}</a>
            </div>
            `
        })
    }
}