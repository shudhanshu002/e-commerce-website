import { Product } from '../models/product.model.js';
import { Category } from '../models/category.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Admin: Create Product
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, owner: req.user._id });
  return res.status(201).json(new ApiResponse(201, product, 'Product created'));
});

// Public: Get a single product by its slug
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate(
    'category',
    'name slug',
  );
  if (!product) throw new ApiError(404, 'Product not found');
  return res.status(200).json(new ApiResponse(200, product));
});

// Public: Get all products with filtering and pagination
const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true });
  return res.status(200).json(new ApiResponse(200, products));
});

// Admin: Category Management
const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, parent } = req.body;
  const category = await Category.create({ name, slug, parent });
  return res
    .status(201)
    .json(new ApiResponse(201, category, 'Category created'));
});

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({});
  return res.status(200).json(new ApiResponse(200, categories));
});

const searchProducts = asyncHandler(async (req, res) => {
  const {
    query, // for text search
    category, // category slug
    minPrice,
    maxPrice,
    sortBy = 'createdAt', // default sort
    sortOrder = 'desc', // default order
    page = 1,
    limit = 10,
  } = req.query;

  const pipeline = [];

  // 1. Text Search stage (if query is provided)
  if (query) {
    pipeline.push({
      $match: {
        $text: { $search: query },
      },
    });
  }

  // 2. Category filtering stage (if category is provided)
  if (category) {
    // This requires a lookup to get the category ID from its slug
    const categoryDoc = await Category.findOne({ slug: category });
    if (categoryDoc) {
      pipeline.push({
        $match: {
          category: categoryDoc._id,
        },
      });
    }
  }

  // 3. Price filtering stage
  const priceFilter = {};
  if (minPrice) priceFilter.$gte = parseFloat(minPrice);
  if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
  if (Object.keys(priceFilter).length > 0) {
    pipeline.push({
      $match: { price: priceFilter },
    });
  }

  // Add a default match for active products
  pipeline.push({ $match: { isActive: true } });

  // 4. Sorting stage
  const sortStage = {};
  sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;
  pipeline.push({ $sort: sortStage });

  // Create an aggregation object
  const aggregate = Product.aggregate(pipeline);

  // 5. Pagination
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const products = await Product.aggregatePaginate(aggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, products, 'Products fetched successfully'));
});

export {
  createProduct,
  getProductBySlug,
 // getAllProducts,
 searchProducts,
  createCategory,
  getAllCategories,
};
