import express from "express";
import dotenv from "dotenv";
dotenv.config()
import { getLaptopNumber, addLaptops, getLaptopCatagory, getLaptopSpecific, updateLaptop, deleteLaptop } from "../models/models.js";

export default function(upload) {

    const router = express.Router();

    function isAuthenticated(req, res, next) {
        if (req.session.userAdmin) {return next();};
        req.flash("error_msg", "You have to login to access that page");
        return res.redirect("/login")
    };

    const LAPTOP_CATAGORY = process.env.LAPTOP_CATAGORY.split(",").map(c => c.trim());

    router.get('/', isAuthenticated, async (req, res) => {
        const error_msg = req.flash("error_msg");
        const warning_msg = req.flash("warning_msg");
        const success_msg = req.flash("success_msg");

        const laptopCount = {};
        for (const l of LAPTOP_CATAGORY) {
            const count = await getLaptopNumber(l);
            laptopCount[l] = count;
        }

        return res.render("admin/home/admin-home", {
            ___laptop_catagory:LAPTOP_CATAGORY,
            ___isAdminLogin: typeof req.session.userAdmin != "undefined" ? true : undefined,
            ___on_admin: true,
            error_msg: typeof error_msg[0] !== "undefined" ? error_msg[0] : undefined,
            warning_msg: typeof warning_msg[0] !== "undefined" ? warning_msg[0] : undefined,
            success_msg: typeof success_msg[0] !== 'undefined' ? success_msg[0] : undefined,
            laptopCount:laptopCount,
            LAPTOP_CATAGORY:LAPTOP_CATAGORY,

        });
    });

    router.get('/add', isAuthenticated, async (req, res) => {

        const error_msg = req.flash("error_msg");
        const warning_msg = req.flash("warning_msg");
        const success_msg = req.flash("success_msg");

        return res.render("admin/edit/add-product", {
            ___laptop_catagory:LAPTOP_CATAGORY,
            ___isAdminLogin: typeof req.session.userAdmin != "undefined" ? true : undefined,
            LAPTOP_CATAGORY:LAPTOP_CATAGORY,
            error_msg: typeof error_msg[0] !== "undefined" ? error_msg[0] : undefined,
            warning_msg: typeof warning_msg[0] !== "undefined" ? warning_msg[0] : undefined,
            success_msg: typeof success_msg[0] !== 'undefined' ? success_msg[0] : undefined,
        });
    });

    router.post('/add', isAuthenticated, upload.fields([
        {name:"img_1", maxCount:1},
        {name:"img_2", maxCount:2},
        {name:"img_3", maxCount:3},
        {name:"img_4", maxCount:4},
        {name:"img_5", maxCount:5},
        {name:"img_6", maxCount:6},
    ]) ,async (req, res) => {
        const data = req.body;
        
        Object.keys(data).forEach(d => {
            if (d == 'description') {}
            else {
                if (typeof data[d] == "undefined" || !data[d]) {
                    req.flash("error_msg", "Input all fields correctly");
                    return res.redirect("/admin/add");
                }
            }
        });

        if (typeof req.files.img_1 == "undefined") {
            req.flash("error_msg", "Image 1 is required!");
            return res.redirect("/admin/add");
        };
        let catagory = data.catagory;
        let state = data.state;
        if (!LAPTOP_CATAGORY.includes(catagory)) catagory = 'other';
        if (!['new', 'used'].includes(state)) state = 'new';

        const img_1 = req.files.img_1[0].path;
        const img_2 = req.files.img_2?.[0]?.path || null;
        const img_3 = req.files.img_3?.[0]?.path || null;
        const img_4 = req.files.img_4?.[0]?.path || null;
        const img_5 = req.files.img_5?.[0]?.path || null;
        const img_6 = req.files.img_6?.[0]?.path || null;

        const doAdd = await addLaptops(data, catagory, state, img_1, img_2, img_3, img_4, img_5, img_6);
        if (!doAdd) {
            req.flash("warning_msg", "Something went wrong while adding a laptop!");
            return res.redirect("/admin/add");
        }
        
        req.flash("success_msg", `Success on adding ${data.name}`);
        return res.redirect(`/laptop/${doAdd}`)
        
    });

    router.get('/edit-catagory/:name', isAuthenticated, async(req, res) => {
        const name = LAPTOP_CATAGORY.includes(req.params.name) ? req.params.name : 'other';
        const laptops = await getLaptopCatagory(name)

        return res.render("web/catagory/catagory", {
            ___laptop_catagory:LAPTOP_CATAGORY,
            ___isAdminLogin: typeof req.session.userAdmin != "undefined" ? true : undefined,
            is_edit:true,
            selectedCatagory:name,
            pcs:laptops,
        });
    });

    router.get('/edit/:id', isAuthenticated, async (req, res) => {
        const id = req.params.id;
        const laptop = await getLaptopSpecific(id);

        if (laptop == 0) {
            req.flash("warning_msg", "Can't find any laptop with the given ID");
            return res.redirect("/admin");
        };if (laptop == false) {
            req.flash("error_msg", "Something went wrong, try again");
            return res.redirect("/admin");
        };

        const error_msg = req.flash("error_msg");
        const warning_msg = req.flash("warning_msg");
        const success_msg = req.flash("success_msg");

        return res.render("admin/edit/add-product", {
            ___laptop_catagory:LAPTOP_CATAGORY,
            ___isAdminLogin: typeof req.session.userAdmin != "undefined" ? true : undefined,
            LAPTOP_CATAGORY:LAPTOP_CATAGORY,
            error_msg: typeof error_msg[0] !== "undefined" ? error_msg[0] : undefined,
            warning_msg: typeof warning_msg[0] !== "undefined" ? warning_msg[0] : undefined,
            success_msg: typeof success_msg[0] !== 'undefined' ? success_msg[0] : undefined,
            laptop: laptop,
            is_edit: true,
        });

    });


    router.post("/edit/:id", 
    upload.fields([
        { name: "img_1", maxCount: 1 },
        { name: "img_2", maxCount: 1 },
        { name: "img_3", maxCount: 1 },
        { name: "img_4", maxCount: 1 },
        { name: "img_5", maxCount: 1 },
        { name: "img_6", maxCount: 1 }
    ]), 
    async (req, res) => {
        try {
            const id = req.params.id;

            const existing = await getLaptopSpecific(id);
            if (!existing) {
                req.flash("error_msg", "Laptop not found!");
                return res.redirect("/admin");
            }

            let imgs = {};
            for (let i = 1; i <= 6; i++) {
                imgs[`img_${i}`] = req.files[`img_${i}`]
                    ? req.files[`img_${i}`][0].path  // Cloudinary returns .path as secure_url
                    : existing[`img_${i}`]; // Keep old one if none uploaded
            }

            const success = await updateLaptop(
                id,
                req.body,
                req.body.catagory,
                req.body.state,
                imgs
            );

            if (!success) {
                req.flash("error_msg", "Error updating laptop");
                return res.redirect(`/admin/edit/${id}`);
            }

            req.flash("success_msg", "Laptop updated successfully!");
            return res.redirect("/laptop/" + id);

        } catch (err) {
            console.log("Error in edit route:", err);
            req.flash("error_msg", "Something went wrong");
            return res.redirect("/admin");
        }
    });

    router.post("/delete/laptop", isAuthenticated, async (req, res) => {
        const {id:id} = req.body;
        const laptop = getLaptopSpecific(id);
        if (laptop == 0) {return res.json({msg:"Can't find any laptop with the give ID"});}
        if (!laptop) return res.json({msg:"Something went wrong"});
        const doDelete = await deleteLaptop(id);
        if (!doDelete) return res.json({msg: "Something went wrong, try again!"});

        return res.json({msg:"Success on deleting the "+laptop.user});
    });

    return router;
}