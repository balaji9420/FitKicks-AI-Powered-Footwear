const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const slugify = require("slugify");

const projectRoot = path.resolve(__dirname, "../..");
const dataRoot = path.join(projectRoot, "shoes-data", "shoes-data");
require("dotenv").config({ path: path.join(projectRoot, "backend", ".env") });

const { connectDB } = require("../src/config/database");
const Product = require("../src/models/product.model");
const { Brand, Category } = require("../src/models/index.models");

const getShoeType = (product) => {
    const category = product.category.toLowerCase();
    if (category.includes("basketball")) return "basketball";
    if (/running|racing|trail/.test(category)) return "running";
    if (category.includes("tennis")) return "sports";
    return "sneakers";
};

const getHeightType = (name) => {
    if (/high[- ]?top/i.test(name)) return "high-top";
    if (/mid/i.test(name)) return "mid-top";
    return "low-top";
};

const toImage = (imagePath, product, index) => {
    const relativePath = imagePath.replace(/^images[\\/]/, "").replace(/\\/g, "/");
    const absolutePath = path.join(dataRoot, "images", relativePath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Catalog image not found: ${absolutePath}`);
    }

    const view = path.basename(imagePath, path.extname(imagePath)).replace(/^\d+-/, "");
    return {
        url: `/catalog-images/${relativePath}`,
        alt: `${product.brand} ${product.name} - ${view} view`,
        isPrimary: index === 0,
    };
};

const importCatalog = async () => {
    const products = JSON.parse(fs.readFileSync(path.join(dataRoot, "products.json"), "utf8"));
    const brandRows = fs.readFileSync(path.join(dataRoot, "brands.csv"), "utf8").trim().split(/\r?\n/).slice(1);
    const brandInfo = new Map(brandRows.map((row) => {
        const [name, country, founded, officialWebsite] = row.split(",");
        return [name, { country, founded: Number(founded), officialWebsite }];
    }));
    await connectDB();

    for (const product of products) {
        const brandSlug = slugify(product.brand, { lower: true, strict: true });
        const brandDetails = brandInfo.get(product.brand) || {};
        const brand = await Brand.findOneAndUpdate(
            { name: product.brand },
            {
                $set: {
                    country: brandDetails.country,
                    founded: brandDetails.founded,
                    website: brandDetails.officialWebsite || product.official_url,
                },
                $setOnInsert: {
                    name: product.brand,
                    slug: brandSlug,
                    isActive: true,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const category = await Category.findOneAndUpdate(
            { name: product.category },
            {
                $setOnInsert: {
                    name: product.category,
                    slug: slugify(product.category, { lower: true, strict: true }),
                    isActive: true,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const marker = `catalog:${product.id.toLowerCase()}`;
        const tags = [...new Set([...product.tags, marker].map((tag) => tag.toLowerCase()))];
        const images = product.images.map((imagePath, index) => toImage(imagePath, product, index));
        const sizes = product.sizes_uk;
        const colors = product.colorways.map((name) => ({
            name,
            sizeStock: sizes.map((size) => ({ size, stock: Number(product.stock) || 0 })),
        }));
        const slug = `${slugify(`${product.brand}-${product.name}`, { lower: true, strict: true })}-${product.id.toLowerCase()}`;

        await Product.findOneAndUpdate(
            { tags: marker },
            {
                $set: {
                    name: product.name,
                    slug,
                    description: product.description,
                    shortDescription: product.description,
                    price: Number(product.price_inr_approx),
                    originalModelYear: Number(product.original_model_year),
                    officialUrl: product.official_url,
                    category: category._id,
                    brand: brand._id,
                    tags,
                    shoeType: getShoeType(product),
                    gender: product.gender.toLowerCase() === "women" ? "women" : "unisex",
                    occasion: ["casual"],
                    material: product.material,
                    heightType: getHeightType(product.name),
                    colors,
                    images,
                    totalStock: Number(product.stock) || 0,
                    isActive: true,
                    isInStock: Number(product.stock) > 0,
                    isFeatured: true,
                    isTrending: tags.includes("trending"),
                    isBestSeller: tags.includes("bestseller"),
                    isNewArrival: false,
                    isLimitedEdition: tags.includes("collector"),
                    metaTitle: `${product.brand} ${product.name}`,
                    metaDescription: product.description,
                },
            },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );
    }

    console.log(`Imported ${products.length} catalog products and their image galleries.`);
};

importCatalog()
    .catch((error) => {
        console.error("Catalog import failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });