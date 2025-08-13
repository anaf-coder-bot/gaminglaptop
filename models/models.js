import { pool } from "./db.js";
import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";

const getAdmin = async () => {
    const adminUser = await pool.query(`SELECT * FROM users`);
    return adminUser.rows[0];
};

const IsDefaultAdmin = async () => {
    const adminUser = await getAdmin();
    return (adminUser.username == process.env.DEFAULT_USERNAME && adminUser.password == process.env.DEFAULT_PASSWORD);
};

const authDefaultAdmin = (username, password) => {
    return (username == process.env.DEFAULT_USERNAME && password == process.env.DEFAULT_PASSWORD);
};

const updateDefaultAdmin = async (username, password, email) => {
    const adminUser = await getAdmin();
    const hashed_password = await bcrypt.hash(password, 10);
    try {
        const update = await pool.query(`UPDATE users SET username = $1, password = $2, email = $3`, [username, hashed_password, email]);
        return true;
    } catch(err) {
        console.log("Error while updating user " + err);
    }
};

const authAdmin = async (password) => {
    const adminUser = await getAdmin();
    const userPass = await bcrypt.compare(password, adminUser.password);
    return userPass;
};

const resetToDefaultUser = async () => {
    try {
        const query = await pool.query(`UPDATE users SET username = $1, password = $2`, [process.env.DEFAULT_USERNAME, process.env.DEFAULT_PASSWORD]);
        return true;
    } catch (err) {
        console.log("Error while setting user to default, " + err);
        return false;
    }
}

const getLaptopNumber = async (catagory) => {
    const count = await pool.query(`SELECT COUNT(*) FROM laptops WHERE catagory = $1`, [catagory]);
    return count.rows[0].count
};

const addLaptops = async (data, catagory, state, img_1, img_2, img_3, img_4, img_5, img_6) => {
    try {
        const query = await pool.query(`INSERT INTO laptops (
                name, model, processor, graphics, ram, storage, display,
                screen_width,catagory, state, in_stock, description, price,
                img_1, img_2, img_3, img_4, img_5, img_6    
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12,$13, 
                $14, $15, $16, $17, $18, $19
            ) RETURNING id
            `, [data.name, data.model, data.processor, data.graphics, data.ram, data.storage, data.display,
                data.screen_width, catagory, state, data.in_stock,data.description, data.price,
                img_1, img_2, img_3, img_4, img_5, img_6
            ]);
        return query.rows[0].id;
    } catch (err) {
        console.log("Error while adding a laptop, " + err);
        return false;
    };
};

const updateLaptop = async (id, data, catagory, state, imgs) => {
    try {
        // Build dynamic query for image fields
        let fields = [
            "name = $1", "model = $2", "processor = $3", "graphics = $4",
            "ram = $5", "storage = $6", "display = $7", "screen_width = $8",
            "catagory = $9", "state = $10", "in_stock = $11", "description = $12",
            "price = $13", "last_modified = CURRENT_DATE"
        ];

        let values = [
            data.name, data.model, data.processor, data.graphics, data.ram, data.storage,
            data.display, data.screen_width, catagory, state, data.in_stock,
            data.description, data.price
        ];

        let counter = values.length;

        // Only update images if provided
        Object.keys(imgs).forEach((key, index) => {
            if (imgs[key]) {
                counter++;
                fields.push(`${key} = $${counter}`);
                values.push(imgs[key]);
            }
        });

        counter++;
        values.push(id); // last param is id

        const query = `
            UPDATE laptops
            SET ${fields.join(", ")}
            WHERE id = $${counter}
        `;

        await pool.query(query, values);
        return true;
    } catch (err) {
        console.log("Error while updating laptop:", err);
        return false;
    }
};

const deleteLaptop = async (id) => {
    try {
        const query = await pool.query(`DELETE FROM laptops WHERE id = $1;`,[id]);
        return true;
    } catch(err) {
        console.log("Error while deleting laptop " + err)
        return false;
    } 
}


const getLaptopRandom = async (limit, without) => {
    let query;
    if (without) { 
        query = await pool.query(`SELECT * FROM laptops WHERE id <> $1 ORDER BY RANDOM() LIMIT $2;`, [without,limit]);
    }else {
        query = await pool.query(`SELECT * FROM laptops ORDER BY RANDOM() LIMIT $1;`, [limit]);
    }
    return query.rows;
};

const getLaptopHome = async () => {
    const query = await pool.query(`SELECT * FROM laptops WHERE in_stock > 0 ORDER BY last_modified DESC LIMIT 50;`);
    return query.rows;
};

const getLaptopCatagory = async (catagory) => {
    const query = await pool.query(`SELECT * FROM laptops WHERE catagory = $1`, [catagory]);
    return query.rows;
};

const getLaptopSpecific = async (id) => {
    try {
        const query = await pool.query(`SELECT * FROM laptops WHERE id = $1`, [id]);
        return query.rows[0] || 0;
    } catch (err) {
        console.log("Error while getting laptop by id " + err);
        return false;
    };
};


export {getAdmin, IsDefaultAdmin, authDefaultAdmin, updateDefaultAdmin, authAdmin, resetToDefaultUser,
        getLaptopNumber, addLaptops, updateLaptop, deleteLaptop, getLaptopRandom, getLaptopHome, 
        getLaptopCatagory, getLaptopSpecific,
};