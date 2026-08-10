import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const bookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  publisherId: {type: mongoose.Schema.Types.ObjectId, ref: 'Publisher', required: true },
  productCode: { type: String, trim: true, unique: true, sparse: true },
  translator: { type: String, trim: true, default: '' },
  publishYear: { type: Number },
  weight: { type: Number, default: 0 },
  dimensions: { type: String, trim: true, default: '' },
  pageCount: { type: Number, default: 0 },
  format: { type: String, trim: true, default: '' },
  description: { type: String, default: '' },
  imageUrl: [{ type: String }],
  quantity: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false}
}, { timestamps: true });

bookSchema.plugin(mongoosePaginate);
bookSchema.virtual("authors", {
  ref: "BookAuthor",
  localField: "_id",
  foreignField: "bookId",
})
bookSchema.set("toJSON", { virtuals: true });
bookSchema.set("toObject", { virtuals: true });
export default mongoose.model('Book', bookSchema);