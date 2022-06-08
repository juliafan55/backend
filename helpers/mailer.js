const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const { OAuth2 } = google.auth;
const oauth_link = "https://developers.google.com/oauthplayground"

const { EMAIL, MAILING_ID, MAILING_REFRESH, MAILING_SECRET } = process.env;

const auth = new OAuth2(
    MAILING_ID,
    MAILING_SECRET,
    MAILING_REFRESH,
    oauth_link
)
    
exports.sendVerificationEmail = (email, name, url) => {
    auth.setCredentials({
        refresh_token: MAILING_REFRESH,
    });
    const accessToken = auth.getAccessToken();
    const stmp = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: EMAIL,
            clientId: MAILING_ID,
            clientSecret: MAILING_SECRET,
            refreshToken: MAILING_REFRESH,
            accessToken,
        }
    });

    const mailOptions = {
        from: EMAIL,
        to: email,
        subject: "Digital Hub email verification",
        html: `<div style="max-width:700px;margin-bottom:1rem;display:flex;align-items:center;gap:10px;font-family:Roboto;font-weight:600"><span>Action required: Activate your Digital Hub account</span></div><div style="padding:1rem 0;border-top:1px solid grey;border-bottom:1px solid grey;color:#000;font-size:17px;font-family:Roboto"><span>Hello ${name}</span><div style="padding:20px 0"><span style="padding:1.5rem 0">You recently created an account on Digital Hub. To complete your registration, please confirm your account.</span></div><a href=${url} style="width:200px;padding:10px 15px;background:#00f;color:#fff;text-decoration:none">Confirm your account</a><br><div style="padding-top:20px"><span style="margin:1.5rem 0;color:grey">Digital Hub allows you to share all your memories!</span></div></div>`
    };
    stmp.sendMail(mailOptions, (err, res) => {
        if (err) return err;
        return res;
    })
}