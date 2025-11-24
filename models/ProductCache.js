import mongoose from "mongoose";

const ProductCacheSchema = new mongoose.Schema(
  {
    // ID de publicación en Mercado Libre (MLA123...)
    item_id: { type: String, required: true, unique: true },

    title: { type: String, required: true },
    price: { type: Number, required: true },

    available_quantity: { type: Number },
    status: { type: String, index: true }, // active, paused, closed...

    thumbnail: { type: String },

    // Categoría
    category_id: { type: String, index: true },  // ej: MLA4559
    category_name: { type: String },             // opcional, cacheado

    // SKU interno u otro identificador
    sku: { type: String, index: true },

    updated_at: { type: Date, default: Date.now, index: true },

    // Objeto crudo de la API de ML (si querés guardar todo)
    raw: { type: Object },
  },
  {
    collection: "productcaches",
  }
);

// Índices adicionales
ProductCacheSchema.index({ category_id: 1, status: 1 });
ProductCacheSchema.index({ title: "text", sku: "text" });

export default mongoose.model("ProductCache", ProductCacheSchema);
