import mongoose from "mongoose";

const ProductCreatePayloadSchema = new mongoose.Schema(
    {
        site_id: { type: String, default: "MLA" },

        category_id: { type: String, required: true },

        buying_mode: {
            type: String,
            enum: ["buy_it_now", "auction"],
            default: "buy_it_now",
            required: true,
        },

        listing_type_id: {
            type: String,
            // gold_special / gold_pro / bronze, etc. Definilo según tu negocio
            default: "gold_special",
            required: true,
        },

        logistic_type: {
            type: String,
            default: "me2",
        },

        shipping: {
            local_pick_up: { type: Boolean, default: false },
            // free_shipping: { type: Boolean, default: false },
        },

        price: { type: Number, required: true },

        title: { type: String, required: true },

        catalog_listing: { type: Boolean, default: false },

        description: { type: String, required: true },

        currency_id: { type: String, default: "ARS" },

        condition: {
            type: String,
            enum: ["new", "used", "not_specified"],
            required: true,
        },

        available_quantity: { type: Number, required: true },

        attributes: [
            {
                id: { type: String, required: true }, // ID del atributo MELI
                value_id: { type: String }, // cuando usás catálogo o valores predefinidos
                value_name: { type: String }, // texto libre
                value_number: { type: Number }, // largo/ancho/alto/peso, etc.
            },
        ],

        sale_terms: [
            {
                id: { type: String },
                value_id: { type: String },
                value_name: { type: String },
            },
        ],

        pictures: [
            {
                source: { type: String, required: true }, // URL absoluta
            },
        ],
    },
    {
        collection: "ProductCreatePayload",
    }
);

const ProductCreatePayload = mongoose.model(
    "ProductCreatePayload",
    ProductCreatePayloadSchema
);

export default ProductCreatePayload;
