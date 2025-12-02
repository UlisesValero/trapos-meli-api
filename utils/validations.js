import axios from "axios";
import ProductCache from "../models/ProductCache.js";
import ProductCreatePayload from "../models/ProductCreatePayload.js";
import { createProduct } from './meliApi.js'


const MELI_API_URI = process.env.MELI_API_URI;

export async function getRequiredAttributes(categoryId) {
  const { data: attributes } = await axios.get(
    `${MELI_API_URI}/categories/${categoryId}/attributes`
  );

  const REQUIRED_TAGS = [
    "required",
    "new_required",
    "conditional_required",
    "required_for_publication",
    "technical_spec",
    "required_technical",
    "catalog_required",
  ];

  const required = attributes.filter((attr) => {
    const tags = Array.isArray(attr.tags) ? attr.tags : [];
    return tags.some((tag) => REQUIRED_TAGS.includes(tag));
  });

  return {
    rawAttributes: attributes,
    required: required.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.value_type,
      tags: Array.isArray(a.tags) ? a.tags : [],
      values_allowed: Array.isArray(a.values)
        ? a.values.map((v) => ({
            id: v.id,
            name: v.name,
          }))
        : [],
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
  console.log(payload);

  const draft = new ProductCreatePayload(payload);
  await draft.validate();

  // toObject sin __v
  const structured = draft.toObject({ versionKey: false });
  console.log("STRUCTURED BEFORE CLEAN:", structured);

  // Sacamos _id y logistic_type del body que va a MELI
  const { _id, logistic_type, ...meliPayload } = structured;

  // Mapear logistic_type a la estructura que MELI sí entiende
  // MELI usa: shipping.mode = "me2" | "self_service" | "fulfillment" | etc.
  if (logistic_type) {
    meliPayload.shipping = {
      ...(meliPayload.shipping || {}),
      mode: logistic_type,
    };
  }

  console.log("PAYLOAD TO MELI:", meliPayload);

  const categoryId = meliPayload.category_id;
  const { required } = await getRequiredAttributes(categoryId);

  const sent = Array.isArray(meliPayload.attributes)
    ? meliPayload.attributes
    : [];

  for (const r of required) {
    const ok = sent.some((s) => s.id === r.id);
    if (!ok) throw new Error(`Falta atributo obligatorio: ${r.id}`);
  }

  const data = await createProduct(meliPayload);

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
