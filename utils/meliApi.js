import axios from "axios";
import { getValidAccessToken } from "./meliAuth.js";


const MELI_API_URI = process.env.MELI_API_URI


async function authHeaders() {
    const access = await getValidAccessToken();
    return { Authorization: `Bearer ${access.access_token}` };
}

export async function listItemsBySeller(sellerId, offset = 0, limit = 50) {
    const headers = await authHeaders();
    const url = `${MELI_API_URI}/users/${sellerId}/items/search`;

    console.log("LIST URL:", url);

    const { data } = await axios.get(url,
        {
            headers,
            params: { offset, limit }
        }
    );
    return data; // { results: [ "MLA123", "MLA456", ... ], paging: { total, offset, limit } }
}

export async function updateProduct(itemId, body) {
    const headers = await authHeaders();
    const url = `${MELI_API_URI}/items/${itemId}`;
    const { data } = await axios.put(url, body, { headers });
    return data;
}


export async function updateDescription(itemId, plain_text) {
    const headers = await authHeaders();
    const url = `${MELI_API_URI}/items/${itemId}/description`;
    const { data } = await axios.put(url, { plain_text }, { headers });
    return data;
}


export async function getProduct(itemId) {
    const headers = await authHeaders();
    const { data } = await axios.get(`${MELI_API_URI}/items/${itemId}`, { headers });
    return data;
}


export async function createProduct(payload) {
    const headers = await authHeaders();
    const { data } = await axios.post(`${MELI_API_URI}/items`, payload, { headers });
    return data;
}


export async function changePublishState(itemId, active = true) {
    const headers = await authHeaders();
    const url = `${MELI_API_URI}/items/${itemId}`;
    const body = { status: active ? 'active' : 'paused' };
    const { data } = await axios.put(url, body, { headers });
    return data;
}


export async function uploadImageToMeli(fileBuffer, filename) {
    // Mercado Libre requires uploading to images endpoint via multipart. The simpler
    // approach is to upload to Meli's images endpoint which returns an `id` and `url`.
    const headers = await authHeaders();
    const form = new FormData();
    form.append('file', fileBuffer, filename);


    const res = await axios.post(`${MELI_API_URI}/pictures`, form, {
        headers: {
            ...headers,
            ...form.getHeaders()
        }
    });


    return res.data; // contains id and location
}