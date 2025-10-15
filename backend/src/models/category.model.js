import mongoose, {Schema} from "mongoose";

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim : true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
}, {timestamps: true});

export const Category = mongoose.model('Category', categorySchema)