import axios from "axios";
import ProductCache from "../models/ProductCache.js";
import ProductCreatePayload from "../models/ProductCreatePayload.js";
import { createProduct } from './meliApi.js'


const MELI_API_URI = process.env.MELI_API_URI;

export async function getRequiredAttributes(categoryId) {
    const { data: attributes } = await axios.get(
        `${MELI_API_URI}/categories/${categoryId}/attributes`
    );

    const required = attributes.filter((attr) => {
        const tags = Array.isArray(attr.tags) ? attr.tags : [];
        return tags.includes("required") || tags.includes("new_required");
    });

    return {
        rawAttributes: attributes,
        required: required.map((a) => ({
            id: a.id,
            type: a.value_type,
        })),
    };
}

export async function validateCategoryService(categoryId) {
    const { data: category } = await axios.get(
        `${MELI_API_URI}/categories/${categoryId}`
    );

    const { rawAttributes, required } = await getRequiredAttributes(categoryId);

    return {
        category_id: category.id,
        name: category.name,
        path: category.path_from_root.map((n) => n.name).join(" > "),
        total_attributes: rawAttributes.length,
        required_attributes: required,
    };
}

export async function createProductService(payload) {
  console.log(payload)
  const draft = new ProductCreatePayload(payload);
  await draft.validate();
  const structured = draft.toObject();
  console.log(structured)

  const categoryId = structured.category_id;
  const { required } = await getRequiredAttributes(categoryId);

  const sent = Array.isArray(structured.attributes)
    ? structured.attributes
    : [];

  for (const r of required) {
    const ok = sent.some((s) => s.id === r.id);
    if (!ok) throw new Error(`Falta atributo obligatorio: ${r.id}`);
  }

  const data = await createProduct(structured);

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

  return data;
}
