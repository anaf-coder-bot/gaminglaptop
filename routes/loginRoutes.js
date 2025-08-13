import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { getAdmin, IsDefaultAdmin, authDefaultAdmin, updateDefaultAdmin, authAdmin, resetToDefaultUser } from "../models/models.js";
import { transporter } from "../app.js";

const router = express.Router();

const LAPTOP_CATAGORY = process.env.LAPTOP_CATAGORY.split(",").map(c => c.trim());

router.get('/', (req, res) => {

    delete req.session.defaultAdminUser;
    delete req.session.userAdmin;

    const error_msg = req.flash("error_msg");
    const warning_msg = req.flash("warning_msg");
    const success_msg = req.flash("success_msg");

    return res.render("authentication/login/login", {
        ___on_login:true,
        ___laptop_catagory:LAPTOP_CATAGORY,
        error_msg: typeof error_msg[0] !== "undefined" ? error_msg[0] : undefined,
        warning_msg: typeof warning_msg[0] !== "undefined" ? warning_msg[0] : undefined,
        success_msg: typeof success_msg[0] !== 'undefined' ? success_msg[0] : undefined,
    });
});

router.post('/', async (req, res) => {
    const {username:username, password:password} = req.body;
    
    if (typeof username === "undefined" || typeof password === "undefined" || !username || !password ) {
        req.flash("error_msg", "Input the fields correctly");
        return res.redirect("/login");
    }
        
    if (await IsDefaultAdmin()) {
        
        if (!authDefaultAdmin(username, password)) {
            req.flash("warning_msg", "Unkown user, try again correctly!");
            return res.redirect("/login");
        };

        req.session.defaultAdminUser = {
            username: await getAdmin().username,
            email: await getAdmin().email
        }
        req.flash("success_msg", "Login Success, Change the default admin!");
        return res.redirect("/login/change-admin");
    };

    const isUser = await authAdmin(password);
    if (!isUser) {
        req.flash("warning_msg", "Unkown user, try again");
        return res.redirect("/login");
    };
    req.session.userAdmin = await getAdmin();
    return res.redirect("/admin");
});

router.post("/send-email/change-admin", isDefaultAdminLogin, (req, res) => {
    const {username:username, email:email} = req.body;
    if (typeof username == "undefined" || typeof email == "undefined" || !username || !email) {
        return res.json({invalid_form:"Input the form correctly"})
    };

    const randCode = req.session.emailCode ? req.session.emailCode.code : Math.floor((Math.random() * 8999) + 1000);

    const mailOption = {
        from: "Gaming Laptop in Ethiopia",
        to: email,
        subject: "Confirm code",
        text: `
        Hello ${username},\n
        Here is your confirmation code to know that is really you\n
        Code: ${randCode}\n\n
        If this isn't your request you can ignore this email.\n\n
        Gamin Laptop in Ethiopia.
        `,
    };
    transporter.sendMail(mailOption, (err, info) => {
        if (err) {
            console.log("Error while sending user email " + err);
            return res.json({"err": "There was a problem sending the email, try again!"});
        } else {
            console.log("Email send: " + info.response);
            req.session.emailCode = {
                code: randCode,
            }
            return res.json({"success": "Email has been sent"});
        }
    })
});



function isDefaultAdminLogin(req, res, next) {
    if (req.session.defaultAdminUser) {
        return next();
    };
    req.flash("error_msg", "You have to login to access that page");
    return res.redirect("/login")
};

router.get('/change-admin', isDefaultAdminLogin, (req, res) => {
    const success_msg = req.flash("success_msg");
    const warning_msg = req.flash("warning_msg");
    const danger_msg = req.flash("danger_msg");
    const sentCode = req.flash("codeSent");

    return res.render("authentication/login/change-admin", {
        success_msg: typeof success_msg[0] !== 'undefined' ? success_msg[0] : undefined,
        warning_msg: typeof warning_msg[0] !== 'undefined' ? warning_msg[0] : undefined,
        error_msg: typeof danger_msg[0] !== 'undefined' ? danger_msg[0] : undefined,
        sentCode: typeof sentCode[0] !== 'undefined' ? sentCode[0] : undefined,
    });
});

router.post('/change-admin', isDefaultAdminLogin, async (req, res) => {
    const {username:username, password:password, email:email, code:code} = req.body;
    if (!await IsDefaultAdmin()) {
        delete req.session.defaultAdminUser;
        return redirect("/login");
    }
    if (typeof username == 'undefined' || typeof password == 'undefined' || typeof email == 'undefined' || typeof code == 'undefined' || !username || !password || !email || !code) {
        req.flash("danger_msg", "Input all fields correctly");
        return res.redirect("/login/change-admin");
    };

    if (authDefaultAdmin(username, password)) {
        req.flash("warning_msg", "Choose a different username and password than the admin profile!");
        req.flash("codeSent", true);
        return res.redirect("/login/change-admin");
    };

    if (code != req.session.emailCode.code) {
        req.flash("warning_msg", "The code you've input is not valid, try again!");
        req.flash("codeSent", true);
        return res.redirect("/login/change-admin");
    };

    const doUpdate = await updateDefaultAdmin(username, password, email);
    if (doUpdate) {
        delete req.session.emailCode;
        delete req.session.defaultAdminUser;
        req.flash("success_msg", "Now you can login using your new username and password!");
        return res.redirect("/login");
    } else {
        req.flash("danger_msg", "Something went wrong, try again");
        req.flash("codeSent", true);
        return res.redirect("/login/change-admin");
    }

});

router.post('/send-email/reset-password', async (req, res) => {
    const {email:email} = req.body;
    if (email != process.env.DEFAULT_EMAIL) {
        return res.json({unknown:"The email is not the admin email!"})
    }

    const randCode = req.session.emailResetCode ? req.session.emailResetCode.code : Math.floor((Math.random() * 8999) + 1000);

    const mailOption = {
        from: "Gaming Laptop in Ethiopia",
        to: email,
        subject: "Reset code",
        text: `
        Hello ${await getAdmin().username},\n
        Here is your confirmation code to know that is really you requesting to reset your password\n
        Code: ${randCode}\n\n
        If this isn't your request you can ignore this email.\n\n
        Gamin Laptop in Ethiopia.
        `,
    };
    transporter.sendMail(mailOption, (err, info) => {
        if (err) {
            console.log("Error while sending user email " + err);
            return res.json({"err": "There was a problem sending the email, try again!"});
        } else {
            console.log("Email send: " + info.response);
            req.session.emailResetCode = {
                code: randCode,
                email:email,
            }
            return res.json({"success": "Email has been sent"});
        }
    })

});

router.get('/reset-password', (req, res) => {
    const success_msg = req.flash("success_msg");
    const warning_msg = req.flash("warning_msg");
    const danger_msg = req.flash("danger_msg");
    return res.render("authentication/login/reset-password", {
        ___laptop_catagory:LAPTOP_CATAGORY,
        success_msg: typeof success_msg[0] !== 'undefined' ? success_msg[0] : undefined,
        warning_msg: typeof warning_msg[0] !== 'undefined' ? warning_msg[0] : undefined,
        error_msg: typeof danger_msg[0] !== 'undefined' ? danger_msg[0] : undefined,
    });
});

const send_default_profile = (email) => {
    const username = process.env.DEFAULT_USERNAME;
    const password = process.env.DEFAULT_PASSWORD;
    const mailOption = {
        from: "Gaming Laptop in Ethiopia",
        to: email,
        subject: "Default profile",
        text: `
        Hello ${username},\n
        We have sent you a default username and password to reset your password\n\n
        Username: ${username}\n
        Password: ${password}\n\n
        Gaming Laptop in Ethiopia
        `,
    };
    transporter.sendMail(mailOption, (err, info) => {
        if (err) {
            console.log("Error while sending user email " + err);
            return {err: "There was a problem sending the email, try again!"};
        } else {
            console.log("Email send: " + info.response);
            return {success:true};
        }
    })
}

router.post('/reset-password', async (req, res) => {
    const {code:code} = req.body;
    if (!req.session.emailResetCode || typeof code == "undefined" || !code) {
        return res.redirect("/login");
    };
    if (code != req.session.emailResetCode.code) {
        req.flash("warning_msg", "Invalid code try again!");
        return res.redirect("/login/reset-password");
    };
    const doDefault = await resetToDefaultUser();
    if (!doDefault) {
        req.flash("err_msg", "Something went wrong, try again");
        return res.redirect("/login/reset-password");
    }

    const sendEmail = send_default_profile(req.session.emailResetCode.email);
    req.flash("success_msg", "Password reseted! Check your email");
    delete req.session.emailResetCode;
    return res.redirect("/login");
});

router.get('/logout', async (req,res) => {
    req.session.destroy(err => {
        if (err) {
            console.log("Error while loggoing out " + err);
            req.flash("error_msg", "Somethin went wrong while trying to logout");
        }
        return res.redirect("/");
    });
});

export default router;