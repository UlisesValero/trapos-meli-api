import mongoose from "mongoose";

const ProductCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    category_id: {
        type: String,
        required: true,
    }
},
    {
        collection: "ProductCategory",
    }
);

const ProductCategory = mongoose.model("ProductCategory", ProductCategorySchema)

export default ProductCategory
