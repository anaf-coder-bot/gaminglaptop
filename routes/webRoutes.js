import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { getLaptopRandom, getLaptopHome, getLaptopCatagory, getLaptopSpecific } from "../models/models.js";

const router = express.Router();

const LAPTOP_CATAGORY = process.env.LAPTOP_CATAGORY.split(',').map(c => c.trim());

router.get('/', async (req, res) => {

    const error_msg = req.flash("error_msg");
    const warning_msg = req.flash("warning_msg");
    const success_msg = req.flash("success_msg");

    const randomLaptop = await getLaptopRandom(5, null);
    const swiper_ = []
    randomLaptop.forEach(rl => {
        const holder = [
            rl.id, rl.name, rl.img_1,
        ]
        swiper_.push(holder);
    })
    const show_pc = await getLaptopHome();
    
    return res.render("web/home/home", {
        ___on_home:true,
        ___laptop_catagory:LAPTOP_CATAGORY,
        ___swiper_info: swiper_.length == 0 ? undefined : swiper_,
        ___show_pc: show_pc,
        ___isAdminLogin: typeof req.session.userAdmin != "undefined" ? true : undefined,
        error_msg: typeof error_msg[0] !== "undefined" ? error_msg[0] : undefined,
        warning_msg: typeof warning_msg[0] !== "undefined" ? warning_msg[0] : undefined,
        success_msg: typeof success_msg[0] !== 'undefined' ? success_msg[0] : undefined,
    });
});

router.get('/catagory', (req, res) => {
    return res.redirect('/');
})

router.get('/catagory/:name', async (req, res) => {
    const catagory = LAPTOP_CATAGORY.includes(req.params.name) ? req.params.name : 'other';

    const laptops = await getLaptopCatagory(catagory)
    return res.render("web/catagory/catagory", {
        ___on_catagory:true,
        ___isAdminLogin: typeof req.session.userAdmin != "undefined" ? true : undefined,
        ___laptop_catagory:LAPTOP_CATAGORY,
        selectedCatagory:catagory,
        pcs:laptops,
    });
});

router.get('/laptop/:id', async (req, res) => {
    const id = req.params.id;
    const laptop = await getLaptopSpecific(id);

    const error_msg = req.flash("error_msg");
    const warning_msg = req.flash("warning_msg");
    const success_msg = req.flash("success_msg");
    
    if (laptop == 0) {
        req.flash("warning_msg", "Can't find any laptop with the given ID");
        return res.redirect("/");
    };if (laptop == false) {
        req.flash("error_msg", "Something went wrong, try again");
        return res.redirect("/");
    };
    const suggestedLaptop = await getLaptopRandom(3, laptop.id);
    return res.render("web/catagory/laptop", {
        ___isAdminLogin: typeof req.session.userAdmin != "undefined" ? true : undefined,
        ___laptop_catagory:LAPTOP_CATAGORY,
        error_msg: typeof error_msg[0] !== "undefined" ? error_msg[0] : undefined,
        warning_msg: typeof warning_msg[0] !== "undefined" ? warning_msg[0] : undefined,
        success_msg: typeof success_msg[0] !== 'undefined' ? success_msg[0] : undefined,
        pc:laptop,
        suggestedPCs:suggestedLaptop,
    });
});

router.get("/about", (req, res) => {

    return res.render("web/contact/about", {
        ___isAdminLogin: typeof req.session.userAdmin != "undefined" ? true : undefined,
        ___laptop_catagory:LAPTOP_CATAGORY,
    });
});

router.get("/about/contact", (req, res) => {

    return res.render("web/contact/contact", {
        ___isAdminLogin: typeof req.session.userAdmin != "undefined" ? true : undefined,
        ___laptop_catagory:LAPTOP_CATAGORY,
    });
});

export default router;