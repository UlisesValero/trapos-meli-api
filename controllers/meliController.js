// src/controllers/meliController.js
import ProductCache from "../models/ProductCache.js";
import ProductCategory from "../models/ProductCategory.js";
import { parseProductListParams, buildProductListQuery } from '../utils/productListParams.js'
import * as meliAPI from "../utils/meliApi.js";

export const listProducts = async (req, res) => {
    try {
        const { page, pageSize, search, status } = parseProductListParams(req);
        const query = buildProductListQuery({ search, status });

        const [total, items] = await Promise.all([
            ProductCache.countDocuments(query),
            ProductCache.find(query)
                .sort({ updated_at: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
        ]);

        res.json({ items, total, page, pageSize });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al listar productos" });
    }

}

export const syncProducts = async (req, res) => {
    try {
        //TODO: Colocar SELLER_ID en .env para poder correr el Sincronizar con MELI
        const sellerId = process.env.MELI_SELLER_ID;

        let offset = 0;
        const limit = 50;
        let synced = 0;

        while (true) {
            const search = await meliAPI.listItemsBySeller(sellerId, offset, limit);
            const ids = search.results;

            if (!ids || ids.length === 0) break;

            // Traer detalle de cada item
            const items = await Promise.all(
                ids.map((id) => meliAPI.getProduct(id))
            );

            const ops = items.map((item) => ({
                updateOne: {
                    filter: { item_id: item.id },
                    update: {
                        $set: {
                            item_id: item.item_id,
                            title: item.title,
                            price: item.price,
                            status: item.status,
                            available_quantity: item.available_quantity,
                            thumbnail: item.thumbnail,
                            category_id: item.category_id,
                            updated_at: new Date(),
                            raw: item,
                        },
                    },
                    upsert: true,
                },
            }));

            if (ops.length) {
                await ProductCache.bulkWrite(ops);
                synced += ops.length;
            }

            offset += limit;
            if (offset >= search.paging.total) break;
        }

        res.json({ ok: true, synced });
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: "Error al sincronizar productos" });
    }
}

export const updateProduct = async (req, res) => {
    // Soporta ambas formas: path param o campos en body
    const itemId =
        req.params.id ||
        req.params.itemId ||
        req.body.itemId ||
        req.body.id;

    const body = req.body; // { title?, price?, available_quantity?, ... }

    if (!itemId) {
        return res.status(400).json({ error: "itemId requerido" });
    }

    try {
        const data = await meliAPI.updateProduct(itemId, body);

        await ProductCache.findOneAndUpdate(
            { item_id: itemId },
            { ...body, updated_at: new Date() },
            { upsert: true }
        );

        res.json(data);
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: err.message });
    }
}

export const deleteProduct = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: "id requerido" });
    }

    try {
        await ProductCache.deleteOne({ item_id: id });
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al eliminar producto de la caché" });
    }
}

export const updateDescription = async (req, res) => {
    // tus rutas actuales NO tienen :itemId, viene en el body
    const itemId =
        req.params.itemId ||
        req.body.itemId ||
        req.body.id;

    const { plain_text } = req.body;

    if (!itemId) {
        return res.status(400).json({ error: "itemId requerido" });
    }

    try {
        const data = await meliAPI.updateDescription(itemId, plain_text);
        res.json(data);
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: err.message });
    }
}

export const createProduct = async (req, res) => {
    const payload = req.body; // payload según docs de Meli

    try {
        const data = await meliAPI.createProduct(payload);

        // opcional: guardarlo en caché
        await ProductCache.findOneAndUpdate(
            { item_id: data.id },
            {
                item_id: data.id,
                title: data.title,
                price: data.price,
                status: data.status,
                available_quantity: data.available_quantity,
                updated_at: new Date(),
            },
            { upsert: true }
        );

        res.json(data);
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: err.message });
    }
}

export const changePublishState = async (req, res) => {
    // la ruta actual no tiene :itemId, viene en el body
    const { itemId, active } = req.body;

    if (!itemId) {
        return res.status(400).json({ error: "itemId requerido" });
    }

    try {
        const data = await meliAPI.changePublishState(itemId, active);

        await ProductCache.findOneAndUpdate(
            { item_id: itemId },
            {
                status: active ? "active" : "paused",
                updated_at: new Date(),
            }
        );

        res.json(data);
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: err.message });
    }
}

export const uploadImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("No file");

        const result = await meliAPI.uploadImageToMeli(
            req.file.buffer,
            req.file.originalname
        );

        res.json(result);
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: err.message });
    }
}

export const createCategory = async (req, res) => {
    try {
        const { name, category_id } = req.body;

        if (!name || !category_id) {
            return res.status(400).json({ error: "Faltan name o category_id" });
        }

        const doc = await ProductCategory.create({ name, category_id });
        res.json(doc);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Error al crear categoría" });
    }
};


export const listUsedCategories = async (req, res) => {
    try {
        const categories = await ProductCache.aggregate([
            {
                $group: {
                    _id: "$category_id",
                    products: { $push: "$title" },
                },
            },
            {
                $project: {
                    _id: 0,
                    category_id: "$_id",
                    products: 1,
                },
            },
        ])
        res.json(categories);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Error al listar categorías usadas" });
    }
};
