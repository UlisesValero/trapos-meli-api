import mongoose from "mongoose";

const ProductCreatePayloadSchema = new mongoose.Schema({
    site_id: { type: String, required: true },
    logistic_type: { type: String, default: "me2" },
    shipping: { local_pick_up: { type: Boolean, default: false } },
    price: { type: Number, required: true },
    listing_type_id: { type: String },
    title: { type: String, required: true },
    catalog_listing: { type: Boolean, default: false },
    description: { type: String, required: true },
    currency_id: { type: String, required: true },
    condition: { type: String, required: true },
    available_quantity: { type: Number, required: true },
    attributes: [
        {
            id: { type: String, required: true },        // ID del atributo de MELI
            value_id: { type: String },                  // opcional si MELI lo usa
            value_name: { type: String },                // texto libre (común)
            value_number: { type: Number }               // para números como largo/ancho/peso
        }
    ]
},
    {
        collection: "ProductCreatePayload"
    })

const ProductCreatePayload = mongoose.model("ProductCreatePayload", ProductCreatePayloadSchema)

export default ProductCreatePayload