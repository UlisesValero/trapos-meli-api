import axios from "axios";
import MeliToken from '../models/MeliToken.js'
import qs from "qs";
import dotenv from "dotenv";
dotenv.config();


const MELI_OAUTH_URL = "https://auth.mercadolibre.com.ar/authorization"; // endpoint for redirect
const TOKEN_URL = "https://api.mercadolibre.com/oauth/token";


export function getAuthUrl() {
    const params = new URLSearchParams({
        response_type: "code",
        client_id: process.env.MELI_CLIENT_ID,
        redirect_uri: process.env.MELI_REDIRECT_URI,
        scope: "read write"
    });


    return `${MELI_OAUTH_URL}?${params.toString()}`;
}


export async function exchangeCodeForToken(code) {
    const body = {
        grant_type: "authorization_code",
        client_id: process.env.MELI_CLIENT_ID,
        client_secret: process.env.MELI_CLIENT_SECRET,
        code,
        redirect_uri: process.env.MELI_REDIRECT_URI
    };

    const { data } = await axios.post(TOKEN_URL, qs.stringify(body), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    // Save to DB (single-account: replace existing doc)
    await MeliToken.deleteMany({});
    const tokenDoc = new MeliToken({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        scope: data.scope,
        token_type: data.token_type,
        obtained_at: new Date()
    });

    await tokenDoc.save();
    return tokenDoc;
}

export async function refreshAccessToken() {
    const token = await MeliToken.findOne();
    if (!token) throw new Error("No refresh token saved. Authorize first.");


    const body = {
        grant_type: "refresh_token",
        client_id: process.env.MELI_CLIENT_ID,
        client_secret: process.env.MELI_CLIENT_SECRET,
        refresh_token: token.refresh_token
    };


    const { data } = await axios.post(TOKEN_URL, qs.stringify(body), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });


    token.access_token = data.access_token;
    token.refresh_token = data.refresh_token || token.refresh_token;
    token.expires_in = data.expires_in;
    token.obtained_at = new Date();
    await token.save();


    return token;
}


export async function getValidAccessToken() {
    let token = await MeliToken.findOne()
    if (!token) throw new Error("No token found. Complete OAuth flow first at /auth/meli")


    const obtainedAt = new Date(token.obtained_at).getTime()
    const expiresInMs = (token.expires_in - 30) * 1000
    if (Date.now() - obtainedAt >= expiresInMs) {
        token = await refreshAccessToken()
    }

    return token
}