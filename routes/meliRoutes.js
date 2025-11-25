import express from "express";
import upload from "../utils/fileUploader.js";
import * as ctrl from "../controllers/meliController.js";
import { getAuthUrl, exchangeCodeForToken } from "../utils/meliAuth.js";

const router = express.Router();


router.get("/categories/used", ctrl.listUsedCategories);
router.post('/categories/add', ctrl.createCategory)
router.get("/categories/debug", ctrl.debugCategories);

router.get("/auth/meli", (req, res) => {
    const url = getAuthUrl();
    res.redirect(url)
});
router.get("/auth/meli/callback", async (req, res) => {
    try {
        const { code } = req.query;
        const tokenDoc = await exchangeCodeForToken(code);
        res.json({ ok: true, token: tokenDoc });
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: "Error al intercambiar code por token" });
    }
});
router.get("/", ctrl.listProducts);
router.post("/products/sync", ctrl.syncProducts);
router.put("/products/:id", ctrl.updateProduct);
router.delete("/products/:id", ctrl.deleteProduct);


//TODO: Pensar si el update / upload image / change publish state requiere colocar /:id en la ruta
router.post('/update-description', ctrl.updateDescription)
router.post('/create-product', ctrl.createProduct)
router.post('/change-publish-state', ctrl.changePublishState)
router.post('/upload-image', upload.single("file"), ctrl.uploadImage)


export default router;