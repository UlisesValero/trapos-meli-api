import mongoose from "mongoose";


const MeliTokenSchema = new mongoose.Schema(
    {
        access_token: { type: String, required: true },
        refresh_token: { type: String, required: true },
        expires_in: { type: Number, required: true },
        obtained_at: { type: Date, default: Date.now },
        scope: String,
        token_type: String
    },
    {
        collection: "MeliToken",
    }
);


export default mongoose.model("MeliToken", MeliTokenSchema);