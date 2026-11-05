import colorsys
import csv
import math
import os
import re
from collections import Counter
from pathlib import Path

import requests
import streamlit as st
from PIL import Image


ROOT = Path(__file__).resolve().parent
CATALOG_DIR = ROOT / "shoes-data" / "shoes-data"
try:
    STREAMLIT_API_URL = st.secrets.get("FITKICKS_API_URL", "")
except FileNotFoundError:
    STREAMLIT_API_URL = ""
API_BASE = (
    os.getenv("FITKICKS_API_URL") or STREAMLIT_API_URL
).strip().rstrip("/") or f"http://localhost:{os.getenv('PORT', '8000')}/api/v1"
API_ORIGIN = API_BASE.split("/api/", 1)[0]

st.set_page_config(
    page_title="FitKicks | Find your next pair",
    page_icon="👟",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
    :root { --orange: #ff6b35; --surface: #151515; --muted: #a1a1aa; }
    .stApp { background: #0a0a0a; color: #f5f5f5; font-family: 'DM Sans', sans-serif; }
    [data-testid="stSidebar"] { background: #111; border-right: 1px solid #252525; }
    [data-testid="stSidebar"] > div:first-child { padding-top: 1.6rem; }
    h1, h2, h3 { font-family: 'Space Grotesk', sans-serif !important; letter-spacing: -0.035em; }
    h1 { font-size: clamp(2.4rem, 5vw, 4.5rem) !important; line-height: 1.02 !important; }
    .eyebrow { color: var(--orange); font-size: .75rem; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
    .hero { padding: 2rem 0 1.6rem; }
    .hero-copy { color: #b6b6b6; max-width: 650px; font-size: 1.08rem; line-height: 1.7; }
    .product-name { font-family: 'Space Grotesk', sans-serif; font-size: 1.06rem; font-weight: 600; min-height: 2.8rem; }
    .product-meta { color: var(--muted); font-size: .86rem; }
    .price { color: #fff; font-weight: 700; font-size: 1.12rem; }
    .match-score { display: inline-block; background: #ff6b3522; border: 1px solid #ff6b3540; color: #ff8a60; border-radius: 999px; padding: .25rem .65rem; font-size: .78rem; font-weight: 700; }
    div.stButton > button { border-radius: 10px; border: 1px solid #353535; background: #191919; color: #f5f5f5; font-weight: 600; transition: .15s ease; }
    div.stButton > button:hover { color: white; border-color: var(--orange); background: #ff6b351a; }
    div.stButton > button[kind="primary"] { background: var(--orange); border-color: var(--orange); color: white; }
    div.stButton > button[kind="primary"]:hover { background: #e85a29; border-color: #e85a29; }
    [data-testid="stMetric"] { background: #151515; border: 1px solid #292929; border-radius: 14px; padding: .9rem 1rem; }
    [data-testid="stMetricValue"] { color: white; }
    [data-testid="stFileUploader"] { background: #151515; border: 1px dashed #454545; border-radius: 14px; padding: .5rem; }
    div[data-baseweb="select"] > div, input, textarea { background-color: #171717 !important; }
    hr { border-color: #282828; }
    .footnote { color: #85858b; font-size: .82rem; }
    </style>
    """,
    unsafe_allow_html=True,
)


def api_request(path, method="GET", token=None, **kwargs):
    headers = kwargs.pop("headers", {})
    if token:
        headers["Authorization"] = f"Bearer {token}"
    response = requests.request(
        method,
        f"{API_BASE}{path}",
        headers=headers,
        timeout=20,
        **kwargs,
    )
    response.raise_for_status()
    payload = response.json()
    if payload.get("success") is False:
        raise ValueError(payload.get("message", "The API rejected the request."))
    return payload


def local_catalog():
    catalog_path = CATALOG_DIR / "products.json"
    if catalog_path.exists():
        import json

        with catalog_path.open(encoding="utf-8") as catalog_file:
            products = json.load(catalog_file)
        return [normalize_local_product(product) for product in products]

    with (CATALOG_DIR / "products.csv").open(encoding="utf-8-sig", newline="") as catalog_file:
        return [normalize_local_product(row) for row in csv.DictReader(catalog_file)]


def normalize_local_product(product):
    return {
        "id": str(product.get("id", "")),
        "name": product.get("name", "Untitled shoe"),
        "brand": product.get("brand", "Independent"),
        "category": product.get("category", "Footwear"),
        "gender": product.get("gender", "Unisex"),
        "price": float(product.get("price_inr_approx") or 0),
        "description": product.get("description", ""),
        "material": product.get("material", ""),
        "tags": product.get("tags", []),
        "sizes": product.get("sizes_uk", []),
        "image": product.get("image_url", ""),
        "images": product.get("images", []),
        "stock": int(product.get("stock") or 0),
        "colors": product.get("colorways", []),
        "official_url": product.get("official_url", ""),
        "slug": product.get("id", ""),
        "rating": float(product.get("average_rating") or 0),
        "review_count": int(product.get("total_reviews") or 0),
        "total_sold": int(product.get("total_sold") or 0),
        "featured": bool(product.get("is_featured") or product.get("is_best_seller")),
        "live": False,
    }


def normalize_api_product(product):
    brand = product.get("brand")
    images = product.get("images") or []
    primary = next((image for image in images if image.get("isPrimary")), images[0] if images else {})
    image_url = primary.get("url", "") if isinstance(primary, dict) else ""
    category = product.get("category")
    tags = product.get("tags") or product.get("aiStyleTags") or []
    colors = product.get("colors") or []
    sizes = sorted(
        {
            entry.get("size")
            for color in colors
            for entry in color.get("sizeStock", [])
            if entry.get("size")
        }
    )
    if not sizes:
        sizes = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"]
    return {
        "id": str(product.get("_id", product.get("id", ""))),
        "name": product.get("name", "Untitled shoe"),
        "brand": brand.get("name", "FitKicks") if isinstance(brand, dict) else str(brand or "FitKicks"),
        "category": category.get("name", "Footwear") if isinstance(category, dict) else str(category or "Footwear"),
        "gender": product.get("gender", "unisex"),
        "price": float(product.get("price") or 0),
        "description": product.get("shortDescription") or product.get("description", ""),
        "material": product.get("material", ""),
        "tags": tags,
        "sizes": sizes,
        "image": image_url,
        "images": images,
        "stock": int(product.get("totalStock") or 0),
        "colors": colors,
        "official_url": product.get("officialUrl", ""),
        "slug": product.get("slug", ""),
        "rating": float(product.get("averageRating") or 0),
        "review_count": int(product.get("totalReviews") or 0),
        "total_sold": int(product.get("totalSold") or 0),
        "featured": bool(product.get("isFeatured") or product.get("isBestSeller") or product.get("isTrending")),
        "live": True,
    }


@st.cache_data(ttl=60, show_spinner=False)
def get_catalog():
    try:
        payload = api_request("/products", params={"limit": 50, "sort": "name"})
        products = payload.get("data", {}).get("products")
        if not isinstance(products, list):
            raise ValueError("The products API returned an unexpected response.")
        return [normalize_api_product(product) for product in products], "api", ""
    except requests.RequestException as error:
        try:
            return local_catalog(), "local", str(error)
        except (OSError, ValueError, KeyError) as catalog_error:
            return [], "error", f"API unavailable ({error}); local catalog could not be loaded ({catalog_error})."


def image_source(product):
    image = product.get("image", "")
    if not image:
        return None
    if product.get("live"):
        if image.startswith(("http://", "https://", "//")):
            return image
        return f"{API_ORIGIN}/{image.lstrip('/')}"
    image_path = (CATALOG_DIR / image).resolve()
    if image_path.is_relative_to(CATALOG_DIR.resolve()) and image_path.is_file():
        return str(image_path)
    return None


def money(amount):
    return f"₹{amount:,.0f}"


def add_to_bag(product, size):
    bag = st.session_state.bag
    item_key = f"{product['id']}::{size}"
    if item_key in bag:
        bag[item_key]["quantity"] += 1
    else:
        bag[item_key] = {"product": product, "size": size, "quantity": 1}


def product_card(product, key_prefix="product"):
    with st.container(border=True):
        source = image_source(product)
        if source:
            st.image(source, width="stretch")
        st.markdown(f"<div class='product-name'>{product['name']}</div>", unsafe_allow_html=True)
        st.markdown(
            f"<div class='product-meta'>{product['brand']} · {product['category']}</div>",
            unsafe_allow_html=True,
        )
        st.markdown(f"<div class='price'>{money(product['price'])}</div>", unsafe_allow_html=True)
        if st.button("View shoe", key=f"{key_prefix}-{product['id']}", width="stretch"):
            st.session_state.selected_product = product["id"]
            st.session_state.page = "Shop"
            st.session_state.navigation = "Shop"
            st.rerun()


def product_detail(products, source):
    selected_id = st.session_state.get("selected_product")
    product = next((item for item in products if item["id"] == selected_id), None)
    if not product:
        st.session_state.selected_product = None
        return False

    if st.button("← Back to shop", key="back-to-shop"):
        st.session_state.selected_product = None
        st.rerun()
    image_col, details_col = st.columns([1.05, 1], gap="large")
    with image_col:
        image = image_source(product)
        if image:
            st.image(image, width="stretch")
        else:
            st.markdown("### 👟")
    with details_col:
        st.markdown(f"<div class='eyebrow'>{product['brand']} · {product['category']}</div>", unsafe_allow_html=True)
        st.title(product["name"])
        st.markdown(f"## {money(product['price'])}")
        if product.get("rating"):
            st.caption(f"★ {product['rating']:.1f} customer rating")
        st.write(product.get("description") or "A versatile pair from the FitKicks catalog.")
        if product.get("material"):
            st.caption(f"Materials: {product['material']}")
        if product.get("colors"):
            colors = product["colors"]
            if colors and isinstance(colors[0], dict):
                colors = [color.get("name", "") for color in colors]
            st.caption("Colorways: " + ", ".join(str(color) for color in colors[:6]))
        sizes = product.get("sizes") or ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"]
        size = st.selectbox("Choose your UK size", sizes, key=f"size-{product['id']}")
        unavailable = source == "api" and product["stock"] < 1
        if unavailable:
            st.warning("Currently out of stock. Try another shoe or check back later.")
        elif st.button("Add to bag", type="primary", width="stretch"):
            add_to_bag(product, size)
            st.success("Added to your session bag.")
        if source == "local":
            st.caption("Demo catalog: bag items are saved only for this Streamlit session.")
        if product.get("official_url", "").startswith("https://"):
            st.link_button("Visit brand website", product["official_url"])
    return True


def shop_page(products, source):
    if product_detail(products, source):
        return

    st.markdown("<div class='hero'><div class='eyebrow'>Find your fit</div><h1>Good shoes.<br><span style='color:#ff6b35'>Better days.</span></h1><p class='hero-copy'>Discover everyday essentials, performance pairs, and the next addition to your rotation.</p></div>", unsafe_allow_html=True)
    search_col, category_col, brand_col, sort_col = st.columns([2, 1, 1, 1])
    with search_col:
        search = st.text_input("Search the collection", placeholder="Try Nike, running, streetwear…")
    with category_col:
        categories = ["All categories"] + sorted({p["category"] for p in products})
        category = st.selectbox("Category", categories)
    with brand_col:
        brands = ["All brands"] + sorted({p["brand"] for p in products})
        brand = st.selectbox("Brand", brands)
    with sort_col:
        sort_mode = st.selectbox("Sort by", ["Featured", "Price: low to high", "Price: high to low", "Name"])

    low, high = (min((p["price"] for p in products), default=0), max((p["price"] for p in products), default=10000))
    min_price, max_price = st.slider("Price range", min_value=int(low), max_value=max(int(high), int(low) + 1), value=(int(low), int(high)))
    filtered = [
        p for p in products
        if (not search or search.casefold() in " ".join([p["name"], p["brand"], p["category"], " ".join(p["tags"] if isinstance(p["tags"], list) else [])]).casefold())
        and (category == "All categories" or p["category"] == category)
        and (brand == "All brands" or p["brand"] == brand)
        and min_price <= p["price"] <= max_price
    ]
    if sort_mode == "Price: low to high":
        filtered.sort(key=lambda product: product["price"])
    elif sort_mode == "Price: high to low":
        filtered.sort(key=lambda product: product["price"], reverse=True)
    elif sort_mode == "Name":
        filtered.sort(key=lambda product: product["name"].casefold())

    st.markdown(f"### The collection <span class='product-meta'>· {len(filtered)} pairs</span>", unsafe_allow_html=True)
    if not filtered:
        st.info("No shoes match those filters. Try a broader search.")
        return
    for start in range(0, len(filtered), 4):
        columns = st.columns(4, gap="medium")
        for column, product in zip(columns, filtered[start : start + 4]):
            with column:
                product_card(product)


def dominant_colors(uploaded_file):
    image = Image.open(uploaded_file).convert("RGB")
    image.thumbnail((64, 64))
    colors = image.quantize(colors=6).convert("RGB").getcolors(64 * 64) or []
    palette = []
    for _, (red, green, blue) in sorted(colors, reverse=True):
        hue, saturation, value = colorsys.rgb_to_hsv(red / 255, green / 255, blue / 255)
        if value < 0.18:
            name = "black"
        elif saturation < 0.12:
            name = "white" if value > 0.82 else "gray"
        elif hue < 0.04 or hue >= 0.96:
            name = "red"
        elif hue < 0.11:
            name = "orange"
        elif hue < 0.2:
            name = "yellow"
        elif hue < 0.46:
            name = "green"
        elif hue < 0.56:
            name = "teal"
        elif hue < 0.7:
            name = "blue"
        elif hue < 0.82:
            name = "purple"
        else:
            name = "pink"
        if name not in palette:
            palette.append(name)
        if len(palette) == 5:
            break
    return palette


STYLE_TAGS = {
    "casual": ("casual", "lifestyle", "everyday", "versatile"),
    "formal": ("formal", "office", "leather", "dress", "polished"),
    "streetwear": ("streetwear", "skate", "retro", "basketball", "hyped", "lifestyle"),
    "sporty": ("sports", "sport", "running", "training", "athletic", "performance"),
    "party": ("party", "statement", "hyped", "bold"),
    "athleisure": ("athleisure", "running", "training", "sport", "comfort"),
    "minimalist": ("minimalist", "minimal", "clean", "classic", "simple"),
    "outdoor": ("outdoor", "trail", "hiking", "rugged", "waterproof"),
}
OCCASION_TAGS = {
    "casual": ("casual", "lifestyle", "everyday"),
    "formal": ("formal", "office", "leather", "dress"),
    "gym": ("gym", "training", "running", "performance"),
    "party": ("party", "statement", "bold"),
    "outdoor": ("outdoor", "trail", "hiking", "rugged"),
    "office": ("office", "business", "formal", "leather"),
    "sports": ("sports", "sport", "basketball", "running", "training"),
    "travel": ("travel", "walking", "comfort", "lifestyle"),
}


def product_text(product):
    values = [
        product.get("name", ""),
        product.get("brand", ""),
        product.get("category", ""),
        product.get("gender", ""),
        product.get("description", ""),
        product.get("material", ""),
    ]
    for key in ("tags", "colors", "sizes"):
        value = product.get(key, [])
        if isinstance(value, list):
            values.extend(
                item.get("name", "") if isinstance(item, dict) else str(item)
                for item in value
            )
    return " ".join(str(value) for value in values if value)


def text_tokens(text):
    return re.findall(r"[a-z0-9]+", str(text).casefold())


def cosine_similarity(left, right):
    left_norm = math.sqrt(sum(value * value for value in left.values()))
    right_norm = math.sqrt(sum(value * value for value in right.values()))
    if not left_norm or not right_norm:
        return 0.0
    return sum(value * right.get(term, 0.0) for term, value in left.items()) / (left_norm * right_norm)


def local_recommendations(
    products,
    style,
    occasion,
    gender,
    colors,
    max_price,
    brand="All brands",
    size="Any size",
    liked_ids=(),
    disliked_ids=(),
):
    documents = [Counter(text_tokens(product_text(product))) for product in products]
    document_frequency = Counter(
        term for document in documents for term in document.keys()
    )
    total_documents = max(len(documents), 1)
    inverse_frequency = {
        term: math.log(1 + total_documents / (1 + frequency))
        for term, frequency in document_frequency.items()
    }

    def vectorize(counts):
        return {
            term: (1 + math.log(count)) * inverse_frequency.get(term, 0.0)
            for term, count in counts.items()
            if count > 0
        }

    document_vectors = [vectorize(document) for document in documents]
    query_terms = (
        list(STYLE_TAGS.get(style, ()))
        + list(OCCASION_TAGS.get(occasion, ()))
        + list(colors)
        + ([] if gender == "unisex" else [gender])
    )
    query = vectorize(Counter(text_tokens(" ".join(query_terms))))

    by_id = {product["id"]: index for index, product in enumerate(products)}
    positive_vectors = [
        document_vectors[by_id[product_id]]
        for product_id in liked_ids
        if product_id in by_id
    ]
    negative_vectors = [
        document_vectors[by_id[product_id]]
        for product_id in disliked_ids
        if product_id in by_id
    ]
    preferred_profile = Counter()
    avoided_profile = Counter()
    for vector in positive_vectors:
        preferred_profile.update(vector)
    for vector in negative_vectors:
        avoided_profile.update(vector)
    preferred_profile = dict(preferred_profile)
    avoided_profile = dict(avoided_profile)

    rated = [
        product["rating"] for product in products
        if product.get("rating", 0) > 0
    ]
    average_rating = sum(rated) / len(rated) if rated else 4.0
    max_sold = max((product.get("total_sold", 0) for product in products), default=0)
    ranked = []

    for index, product in enumerate(products):
        if product["id"] in disliked_ids:
            continue
        if product["price"] > max_price:
            continue
        if brand != "All brands" and product["brand"] != brand:
            continue
        if size != "Any size" and size not in product.get("sizes", []):
            continue
        if product.get("stock", 0) < 1:
            continue

        vector = document_vectors[index]
        content_score = cosine_similarity(query, vector)
        preference_score = cosine_similarity(preferred_profile, vector)
        avoid_score = cosine_similarity(avoided_profile, vector)
        rating = product.get("rating", 0)
        review_count = product.get("review_count", 0)
        bayesian_rating = (
            (review_count / (review_count + 5)) * rating
            + (5 / (review_count + 5)) * average_rating
            if rating > 0
            else average_rating
        )
        quality_score = max(0.0, min(bayesian_rating / 5, 1.0))
        popularity_score = (
            math.log1p(product.get("total_sold", 0)) / math.log1p(max_sold)
            if max_sold > 0
            else 0.0
        )
        gender_match = (
            gender == "unisex"
            or product.get("gender", "").casefold() in (gender, "unisex")
        )
        raw_score = (
            0.58 * content_score
            + 0.14 * preference_score
            - 0.12 * avoid_score
            + 0.18 * quality_score
            + 0.05 * popularity_score
            + (0.05 if gender_match else 0)
            + (0.02 if product.get("featured") else 0)
        )
        score = max(1, min(99, round(raw_score * 100)))
        reasons = []
        if content_score > 0:
            reasons.append(f"Style/occasion similarity {round(content_score * 100)}%")
        if rating > 0 and review_count > 0:
            reasons.append(f"{rating:.1f}★ from {review_count} reviews")
        elif product.get("featured") or product.get("total_sold", 0) > 0:
            reasons.append("Popular catalog pick")
        if preference_score > 0.05:
            reasons.append("Similar to pairs you liked")
        if product.get("stock", 0) > 0:
            reasons.append("In stock")
        ranked.append((score, product, reasons))

    return sorted(ranked, key=lambda result: result[0], reverse=True)


def ai_page(products):
    st.markdown(
        "<div class='hero'><div class='eyebrow'>FitKicks shoe finder · free local AI</div>"
        "<h1>Your style.<br><span style='color:#ff6b35'>Your next pair.</span></h1>"
        "<p class='hero-copy'>Find shoes that fit your style, occasion, budget, and UK size. "
        "Recommendations run locally against the FitKicks catalog—no paid AI API required.</p></div>",
        unsafe_allow_html=True,
    )
    left, right = st.columns([1, 1], gap="large")
    with left:
        upload = st.file_uploader(
            "Outfit photo (optional; analyzed on this device)",
            type=["png", "jpg", "jpeg", "webp"],
        )
        if upload and upload.size > 6 * 1024 * 1024:
            st.error("Choose an image smaller than 6 MB.")
            upload = None
        elif upload:
            st.image(upload, width="stretch")
        style = st.selectbox(
            "Style",
            ["casual", "streetwear", "sporty", "formal", "party", "athleisure", "minimalist", "outdoor"],
        )
        occasion = st.selectbox(
            "Occasion",
            ["casual", "gym", "sports", "formal", "office", "party", "outdoor", "travel"],
        )
        gender = st.selectbox("Fit preference", ["unisex", "men", "women", "kids"])
        brands = ["All brands"] + sorted({product["brand"] for product in products})
        brand = st.selectbox("Preferred brand", brands)
        max_price = st.slider(
            "Maximum budget",
            min_value=1000,
            max_value=50000,
            value=25000,
            step=1000,
            format="₹%d",
        )
        sizes = ["Any size"] + sorted(
            {size for product in products for size in product.get("sizes", [])}
        )
        size = st.selectbox("UK shoe size", sizes)
        colors = []
        if upload:
            try:
                colors = dominant_colors(upload)
                st.caption("Detected outfit colors: " + " · ".join(colors))
            except (OSError, ValueError):
                st.error("That image could not be read. Try a JPG or PNG image.")
        find_matches = st.button(
            "Find my best matches",
            type="primary",
            width="stretch",
        )

    liked_ids = st.session_state.get("liked_shoes", [])
    disliked_ids = st.session_state.get("disliked_shoes", [])
    if find_matches:
            st.session_state.ai_preferences = {
                "style": style,
                "occasion": occasion,
                "gender": gender,
                "colors": colors,
                "max_price": max_price,
                "brand": brand,
                "size": size,
            }
            st.session_state.ai_recommendations = local_recommendations(
                products, style, occasion, gender, colors, max_price, brand, size,
                liked_ids, disliked_ids,
            )

    recommendations = st.session_state.get("ai_recommendations")
    with right:
        st.markdown("### How your matches are ranked")
        st.markdown(
            "- **TF-IDF + cosine similarity** retrieves shoes whose catalog descriptions match your style and occasion.\n"
            "- **Quality signals** use available customer ratings, review counts, popularity, and featured status.\n"
            "- **Personalization** learns from the likes and dislikes you give during this session.\n"
            "- **Fit filters** respect your budget, brand, size, and current stock."
        )
        st.caption("Your outfit photo is analyzed on this device. It is not uploaded to an AI service.")
        if liked_ids or disliked_ids:
            st.caption(
                f"Session learning: {len(liked_ids)} liked · {len(disliked_ids)} not for you. "
                "Feedback is not stored on a server."
            )
        if recommendations is None:
            st.info("Choose your preferences and tap “Find my best matches.”")
        elif not recommendations:
            st.warning("No in-stock shoes match every filter. Try a higher budget or another size.")
        else:
            st.success(f"Ranked {len(recommendations)} in-stock shoes from the catalog.")
            for score, product, reasons in recommendations[:8]:
                with st.container(border=True):
                    image = image_source(product)
                    if image:
                        st.image(image, width=220)
                    st.markdown(f"**{product['name']}** · {product['brand']}")
                    st.markdown(
                        f"<span class='match-score'>{score}% match</span> &nbsp; "
                        f"{money(product['price'])}",
                        unsafe_allow_html=True,
                    )
                    st.caption(" · ".join(reasons[:3]) or "Matches your selected preferences")
                    action_col, like_col, dislike_col = st.columns([2, 1, 1])
                    with action_col:
                        if st.button("View this shoe", key=f"ai-view-{product['id']}"):
                            st.session_state.selected_product = product["id"]
                            st.session_state.page = "Shop"
                            st.session_state.navigation = "Shop"
                            st.rerun()
                    with like_col:
                        if st.button("👍", key=f"ai-like-{product['id']}", help="Show me similar shoes"):
                            if product["id"] not in st.session_state.liked_shoes:
                                st.session_state.liked_shoes.append(product["id"])
                            if product["id"] in st.session_state.disliked_shoes:
                                st.session_state.disliked_shoes.remove(product["id"])
                            preferences = st.session_state.get("ai_preferences", {})
                            st.session_state.ai_recommendations = local_recommendations(
                                products,
                                preferences.get("style", style),
                                preferences.get("occasion", occasion),
                                preferences.get("gender", gender),
                                preferences.get("colors", colors),
                                preferences.get("max_price", max_price),
                                preferences.get("brand", brand),
                                preferences.get("size", size),
                                st.session_state.liked_shoes,
                                st.session_state.disliked_shoes,
                            )
                            st.rerun()
                    with dislike_col:
                        if st.button("👎", key=f"ai-dislike-{product['id']}", help="Show me fewer shoes like this"):
                            if product["id"] not in st.session_state.disliked_shoes:
                                st.session_state.disliked_shoes.append(product["id"])
                            if product["id"] in st.session_state.liked_shoes:
                                st.session_state.liked_shoes.remove(product["id"])
                            preferences = st.session_state.get("ai_preferences", {})
                            st.session_state.ai_recommendations = local_recommendations(
                                products,
                                preferences.get("style", style),
                                preferences.get("occasion", occasion),
                                preferences.get("gender", gender),
                                preferences.get("colors", colors),
                                preferences.get("max_price", max_price),
                                preferences.get("brand", brand),
                                preferences.get("size", size),
                                st.session_state.liked_shoes,
                                st.session_state.disliked_shoes,
                            )
                            st.rerun()


def local_support_answer(question, products):
    normalized_question = question.casefold()
    policy_documents = [
        {
            "title": "Shipping information",
            "content": "The FitKicks storefront advertises free shipping on orders above ₹999. Confirm applicable options during checkout.",
            "terms": {"shipping", "delivery", "deliver", "ship", "free"},
        },
        {
            "title": "Returns information",
            "content": "The FitKicks storefront advertises easy returns within 7 days. Confirm eligibility and instructions in your order details.",
            "terms": {"return", "returns", "refund", "exchange"},
        },
        {
            "title": "Order information",
            "content": "Sign in to your FitKicks account and open My Orders to view order history and available status details.",
            "terms": {"order", "orders", "tracking", "track", "status"},
        },
        {
            "title": "Size and availability information",
            "content": "Available sizes and stock can change. Check the current product details before placing an order.",
            "terms": {"size", "sizes", "fit", "stock", "available", "availability"},
        },
    ]
    query_tokens = set(text_tokens(question))
    for word, expansions in {
        "shoe": ("shoes", "sneaker", "sneakers", "footwear"),
        "shoes": ("shoe", "sneaker", "sneakers", "footwear"),
        "delivery": ("shipping", "ship"),
        "return": ("returns", "refund", "exchange"),
        "size": ("sizes", "uk"),
    }.items():
        if word in query_tokens:
            query_tokens.update(expansions)

    requested_brand = next(
        (brand for brand in {product["brand"] for product in products}
         if brand.casefold() in normalized_question),
        None,
    )
    budget_match = re.search(
        r"(?:under|below|less than|up to|within)\s*(?:₹|rs\.?\s*)?([\d,]+(?:\.\d+)?)\s*(k)?",
        normalized_question,
    )
    maximum_price = (
        float(budget_match.group(1).replace(",", "")) * (1000 if budget_match.group(2) else 1)
        if budget_match
        else None
    )
    filtered_products = [
        product for product in products
        if product.get("stock", 0) > 0
        and (not requested_brand or product["brand"].casefold() == requested_brand.casefold())
        and (maximum_price is None or product["price"] <= maximum_price)
    ]

    ranked_products = []
    for product in filtered_products:
        product_terms = set(text_tokens(product_text(product)))
        overlap = query_tokens & product_terms
        if overlap:
            ranked_products.append((len(overlap) / max(len(query_tokens), 1), product, overlap))
    ranked_products.sort(key=lambda result: result[0], reverse=True)

    policy_matches = [
        document for document in policy_documents
        if query_tokens & document["terms"]
    ]
    best_policy = policy_matches[0] if policy_matches else None
    if best_policy and not ranked_products:
        return {
            "answer": best_policy["content"],
            "sources": [{"title": best_policy["title"], "excerpt": best_policy["content"]}],
            "products": [],
        }
    if not ranked_products:
        return {
            "answer": "I couldn't find an in-stock shoe matching that request in the catalog or store information. Try another brand or budget, or ask about shipping, returns, or orders.",
            "sources": [],
            "products": [],
        }

    matches = ranked_products[:3]
    answer = "Here are the closest catalog matches I found."
    if requested_brand and maximum_price is not None:
        answer = f"Here are the {requested_brand} catalog matches priced up to {money(maximum_price)}."
    elif requested_brand:
        answer = f"Here are the closest {requested_brand} catalog matches."
    elif maximum_price is not None:
        answer = f"Here are catalog matches priced up to {money(maximum_price)}."
    elif best_policy and best_policy["title"] == "Size and availability information":
        answer = best_policy["content"]

    return {
        "answer": answer,
        "sources": [
            {
                "title": f"{product['brand']} {product['name']}",
                "excerpt": product.get("description") or "Catalog product listing.",
            }
            for _, product, _ in matches
        ],
        "products": matches,
    }


def support_page(products, source):
    st.markdown(
        "<div class='hero'><div class='eyebrow'>Catalog-grounded help</div>"
        "<h1>Ask FitKicks.<br><span style='color:#ff6b35'>Get a straight answer.</span></h1>"
        "<p class='hero-copy'>Answers are retrieved from the shoe catalog and published store information. "
        "No paid AI service is required; unsupported questions are not guessed.</p></div>",
        unsafe_allow_html=True,
    )
    for message in st.session_state.support_messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            for product in message.get("products", []):
                st.markdown(
                    f"**{product['brand']} {product['name']}** · {money(product['price'])}"
                )
            if message.get("sources"):
                with st.expander("Sources used"):
                    for evidence in message["sources"]:
                        st.markdown(f"**{evidence['title']}**  \n{evidence['excerpt']}")
    question = st.chat_input("Ask about shoes, sizes, stock, shipping, or returns")
    if question:
        st.session_state.support_messages.append({"role": "user", "content": question})
        try:
            if source == "api":
                result = api_request("/ai/chat", method="POST", json={"question": question})
                data = result.get("data") or {}
                answer = data.get("answer")
                if not answer:
                    raise ValueError("The support API returned no answer.")
                message = {
                    "role": "assistant",
                    "content": answer,
                    "sources": data.get("sources") or [],
                    "products": [
                        normalize_api_product(item.get("product", item))
                        for item in (data.get("products") or [])
                        if isinstance(item, dict)
                        and isinstance(item.get("product", item), dict)
                        and item.get("product", item).get("name")
                    ],
                }
            else:
                data = local_support_answer(question, products)
                message = {
                    "role": "assistant",
                    "content": data["answer"],
                    "sources": data["sources"],
                    "products": [product for _, product, _ in data["products"]],
                }
        except requests.RequestException as error:
            message = {
                "role": "assistant",
                "content": f"Could not reach the FitKicks support service: {error}",
                "sources": [],
                "products": [],
            }
        except (ValueError, KeyError, TypeError) as error:
            message = {
                "role": "assistant",
                "content": f"Could not prepare an answer: {error}",
                "sources": [],
                "products": [],
            }
        st.session_state.support_messages.append(message)
        st.rerun()


def admin_page():
    user = st.session_state.get("user") or {}
    if user.get("role") != "admin":
        st.error("This page is available only to FitKicks administrators.")
        return
    st.markdown("<div class='eyebrow'>FitKicks Admin</div><h1>Store dashboard</h1>", unsafe_allow_html=True)
    token = st.session_state.get("access_token")
    dashboard_tab, products_tab, orders_tab, users_tab, ai_tab = st.tabs(
        ["Overview", "Inventory", "Orders", "Users", "AI insights"]
    )

    with dashboard_tab:
        try:
            response = api_request("/analytics/dashboard", token=token, params={"days": 30})
            data = response.get("data", {})
            summary = data.get("summary", {})
            columns = st.columns(4)
            columns[0].metric("Revenue", money(summary.get("totalRevenue", 0)))
            columns[1].metric("Orders", summary.get("totalOrders", 0))
            columns[2].metric("Pending orders", summary.get("pendingOrders", 0))
            columns[3].metric("New customers", summary.get("newUsers", 0))
            st.markdown("### Low stock alerts")
            low_stock = data.get("lowStockProducts") or []
            st.dataframe(
                [
                    {"Shoe": item.get("name", "Unknown"), "Stock": item.get("totalStock", 0)}
                    for item in low_stock
                ],
                use_container_width=True,
                hide_index=True,
            )
        except (requests.RequestException, ValueError) as error:
            st.error(f"Could not load the admin dashboard: {error}")

    with products_tab:
        try:
            response = api_request("/products/admin/inventory", token=token)
            products = response.get("data", {}).get("products") or []
            st.dataframe(
                [
                    {
                        "Shoe": product.get("name", "Unknown"),
                        "Brand": (product.get("brand") or {}).get("name", ""),
                        "Total stock": product.get("totalStock", 0),
                        "In stock": product.get("isInStock", False),
                    }
                    for product in products
                ],
                use_container_width=True,
                hide_index=True,
            )
            editable_products = {
                f"{product.get('name', 'Unknown')} · {product.get('totalStock', 0)} in stock":
                    product for product in products if product.get("colors")
            }
            if editable_products:
                selected_label = st.selectbox(
                    "Update stock for",
                    list(editable_products),
                    key="admin-inventory-product",
                )
                selected_product = editable_products[selected_label]
                with st.form("admin-inventory-form"):
                    updated_colors = []
                    for color in selected_product.get("colors", []):
                        updated_sizes = []
                        for size in color.get("sizeStock", []):
                            stock = st.number_input(
                                f"{color.get('name', 'Color')} · UK {size.get('size', '')}",
                                min_value=0,
                                max_value=100000,
                                value=int(size.get("stock", 0)),
                                step=1,
                                key=f"inventory-{selected_product['_id']}-{color.get('name')}-{size.get('size')}",
                            )
                            updated_sizes.append({"size": size.get("size"), "stock": stock})
                        updated_colors.append({
                            "name": color.get("name"),
                            "sizeStock": updated_sizes,
                        })
                    save_inventory = st.form_submit_button("Save inventory", type="primary")
                if save_inventory:
                    try:
                        api_request(
                            f"/products/admin/{selected_product['_id']}/inventory",
                            method="PATCH",
                            token=token,
                            json={"colors": updated_colors},
                        )
                        get_catalog.clear()
                        st.success("Inventory updated.")
                        st.rerun()
                    except (requests.RequestException, ValueError) as error:
                        st.error(f"Could not update inventory: {error}")
        except (requests.RequestException, ValueError) as error:
            st.error(f"Could not load inventory: {error}")

    with orders_tab:
        try:
            response = api_request("/orders/admin/all", token=token)
            orders = response.get("orders") or []
            st.dataframe(
                [
                    {
                        "Order": str(order.get("_id", "")),
                        "Status": order.get("status", ""),
                        "Total": money(order.get("totalAmount", 0)),
                        "Date": str(order.get("createdAt", ""))[:10],
                    }
                    for order in orders
                ],
                use_container_width=True,
                hide_index=True,
            )
        except (requests.RequestException, ValueError) as error:
            st.error(f"Could not load orders: {error}")

    with users_tab:
        try:
            response = api_request("/users/admin/users", token=token, params={"limit": 100})
            users = response.get("data", {}).get("users") or []
            st.dataframe(
                [
                    {
                        "Name": f"{user.get('firstName', '')} {user.get('lastName', '')}".strip(),
                        "Email": user.get("email", ""),
                        "Role": user.get("role", ""),
                        "Active": user.get("isActive", False),
                        "Orders": user.get("totalOrders", 0),
                        "Spent": money(user.get("totalSpent", 0)),
                    }
                    for user in users
                ],
                use_container_width=True,
                hide_index=True,
            )
            active_users = {
                f"{item.get('firstName', '')} {item.get('lastName', '')} · {item.get('email', '')}":
                    item for item in users
            }
            if active_users:
                with st.form("admin-user-status-form"):
                    selected_user_label = st.selectbox("Select a user", list(active_users))
                    toggle_user = st.form_submit_button("Toggle account status")
                if toggle_user:
                    try:
                        selected_user = active_users[selected_user_label]
                        api_request(
                            f"/users/admin/{selected_user['_id']}/toggle-status",
                            method="PATCH",
                            token=token,
                        )
                        st.success("User account status updated.")
                        st.rerun()
                    except (requests.RequestException, ValueError, KeyError) as error:
                        st.error(f"Could not update the user status: {error}")
        except (requests.RequestException, ValueError) as error:
            st.error(f"Could not load users: {error}")

    with ai_tab:
        try:
            response = api_request("/ai/analytics", token=token, params={"days": 30})
            data = response.get("data", {})
            columns = st.columns(4)
            columns[0].metric("Total analyses", data.get("totalAnalyses", 0))
            columns[1].metric("Success rate", f"{data.get('successRate', 0)}%")
            columns[2].metric("Cart conversion", f"{data.get('cartConversionRate', 0)}%")
            columns[3].metric("Purchase conversion", f"{data.get('purchaseConversionRate', 0)}%")
            st.dataframe(
                [
                    {"Style": item.get("_id") or "Not specified", "Analyses": item.get("count", 0)}
                    for item in data.get("topStyles", [])
                ],
                use_container_width=True,
                hide_index=True,
            )
        except (requests.RequestException, ValueError) as error:
            st.error(f"Could not load AI insights: {error}")


def bag_page():
    st.markdown("<div class='eyebrow'>Your picks</div><h1>Your bag</h1>", unsafe_allow_html=True)
    bag = st.session_state.bag
    if not bag:
        st.info("Your bag is empty. Browse the collection to find your next pair.")
        if st.button("Explore shoes", type="primary"):
            st.session_state.page = "Shop"
            st.session_state.navigation = "Shop"
            st.rerun()
        return

    subtotal = 0
    for item_key, item in list(bag.items()):
        product = item["product"]
        line_total = product["price"] * item["quantity"]
        subtotal += line_total
        item_col, size_col, qty_col, remove_col = st.columns([4, 1, 1, 1])
        with item_col:
            st.markdown(f"**{product['name']}**")
            st.caption(f"{product['brand']} · Size {item['size']}")
        with size_col:
            st.write(money(product["price"]))
        with qty_col:
            st.write(f"Qty {item['quantity']}")
        with remove_col:
            if st.button("Remove", key=f"remove-{item_key}"):
                del bag[item_key]
                st.rerun()
        st.divider()
    st.markdown(f"### Subtotal: {money(subtotal)}")
    st.caption("This Streamlit version stores bag items for the current session. Checkout and payment are not enabled.")


def saved_page(products):
    st.markdown("<div class='eyebrow'>Keep an eye on these</div><h1>Saved shoes</h1>", unsafe_allow_html=True)
    saved = st.session_state.saved
    if not saved:
        st.info("You haven't saved any shoes yet. Browse the collection and tap Save.")
        return
    selected = [product for product in products if product["id"] in saved]
    for start in range(0, len(selected), 4):
        columns = st.columns(4, gap="medium")
        for column, product in zip(columns, selected[start : start + 4]):
            with column:
                product_card(product, "saved")
                if st.button("Remove saved shoe", key=f"unsave-{product['id']}", width="stretch"):
                    saved.remove(product["id"])
                    st.rerun()


def account_page():
    st.markdown(
        "<div class='eyebrow'>FitKicks account</div><h1>Your account.<br>"
        "<span style='color:#ff6b35'>Your rotation.</span></h1>",
        unsafe_allow_html=True,
    )
    token = st.session_state.get("access_token")
    user = st.session_state.get("user")
    if token and user:
        name = user.get("fullName") or user.get("name") or user.get("email") or "FitKicks member"
        st.success(f"Signed in as {name}.")
        st.caption(user.get("email", ""))
        if st.button("Sign out"):
            try:
                api_request("/auth/logout", method="POST", token=token)
            except requests.RequestException as error:
                st.warning(f"Could not notify the API during sign-out: {error}")
            st.session_state.access_token = None
            st.session_state.user = None
            st.rerun()
        return

    sign_in_tab, create_account_tab, verify_tab = st.tabs(
        ["Sign in", "Create account", "Verify email"]
    )
    with sign_in_tab:
        with st.form("login-form"):
            email = st.text_input("Email", autocomplete="email")
            password = st.text_input(
                "Password",
                type="password",
                autocomplete="current-password",
            )
            submitted = st.form_submit_button("Sign in", type="primary", width="stretch")
        if submitted:
            try:
                result = api_request(
                    "/auth/login",
                    method="POST",
                    json={"email": email.strip().lower(), "password": password},
                )
                access_token = result.get("accessToken")
                if not access_token:
                    st.error("The API signed in without returning an access token.")
                else:
                    st.session_state.access_token = access_token
                    st.session_state.user = result.get("user") or {
                        "email": email.strip().lower()
                    }
                    st.rerun()
            except requests.HTTPError as error:
                message = "Sign-in failed."
                try:
                    message = error.response.json().get("message", message)
                except (ValueError, AttributeError):
                    pass
                st.error(message)
            except requests.RequestException as error:
                st.error(f"Could not reach the FitKicks API at {API_BASE}: {error}")

        with st.expander("Forgot your password?"):
            with st.form("forgot-password-form"):
                reset_email = st.text_input("Account email", key="reset-email")
                request_reset = st.form_submit_button("Send reset link")
            if request_reset:
                try:
                    result = api_request(
                        "/auth/forgot-password",
                        method="POST",
                        json={"email": reset_email.strip().lower()},
                    )
                    st.success(result.get("message", "If the account exists, a reset link was sent."))
                except requests.HTTPError as error:
                    try:
                        st.error(error.response.json().get("message", "Could not request a reset link."))
                    except (ValueError, AttributeError):
                        st.error("Could not request a reset link.")
                except requests.RequestException as error:
                    st.error(f"Could not reach the FitKicks API: {error}")

    with create_account_tab:
        st.caption("Create your account, then verify the 6-digit code sent to your email.")
        with st.form("register-form"):
            first_name = st.text_input("First name", autocomplete="given-name")
            last_name = st.text_input("Last name", autocomplete="family-name")
            new_email = st.text_input("Email", key="register-email", autocomplete="email")
            new_password = st.text_input(
                "Password (at least 8 characters)",
                type="password",
                key="register-password",
                autocomplete="new-password",
            )
            register = st.form_submit_button(
                "Create account",
                type="primary",
                width="stretch",
            )
        if register:
            if not all((first_name.strip(), last_name.strip(), new_email.strip())):
                st.error("Enter your first name, last name, and email.")
            elif len(new_password) < 8:
                st.error("Your password must be at least 8 characters.")
            else:
                try:
                    result = api_request(
                        "/auth/register",
                        method="POST",
                        json={
                            "firstName": first_name.strip(),
                            "lastName": last_name.strip(),
                            "email": new_email.strip().lower(),
                            "password": new_password,
                        },
                    )
                    st.session_state.pending_verification_user_id = result.get("userId")
                    st.success(result.get("message", "Verification code sent. Open the Verify email tab."))
                except requests.HTTPError as error:
                    try:
                        st.error(error.response.json().get("message", "Could not create your account."))
                    except (ValueError, AttributeError):
                        st.error("Could not create your account.")
                except requests.RequestException as error:
                    st.error(f"Could not reach the FitKicks API: {error}")

    with verify_tab:
        with st.form("verify-email-form"):
            pending_id = st.session_state.get("pending_verification_user_id", "")
            verification_id = st.text_input(
                "Account verification ID",
                value=str(pending_id or ""),
                help="This ID is provided after creating your account.",
            )
            otp = st.text_input("6-digit verification code", max_chars=6)
            verify = st.form_submit_button(
                "Verify and sign in",
                type="primary",
                width="stretch",
            )
        if verify:
            if not verification_id.strip() or not otp.strip():
                st.error("Enter your verification ID and the code from your email.")
            else:
                try:
                    result = api_request(
                        "/auth/verify-email",
                        method="POST",
                        json={"userId": verification_id.strip(), "otp": otp.strip()},
                    )
                    access_token = result.get("accessToken")
                    if not access_token:
                        st.error("Email verified, but the API did not return a sign-in token.")
                    else:
                        st.session_state.access_token = access_token
                        st.session_state.user = result.get("user") or {}
                        st.session_state.pending_verification_user_id = None
                        st.rerun()
                except requests.HTTPError as error:
                    try:
                        st.error(error.response.json().get("message", "Email verification failed."))
                    except (ValueError, AttributeError):
                        st.error("Email verification failed.")
                except requests.RequestException as error:
                    st.error(f"Could not reach the FitKicks API: {error}")

    st.caption("Account sign-in and verification require the FitKicks API, MongoDB, and configured email delivery.")


def main():
    for key, initial in {
        "page": "Shop",
        "selected_product": None,
        "bag": {},
        "saved": [],
        "access_token": None,
        "user": None,
        "ai_recommendations": None,
        "ai_mode": None,
        "liked_shoes": [],
        "disliked_shoes": [],
        "pending_verification_user_id": None,
        "ai_preferences": {},
        "support_messages": [],
    }.items():
        st.session_state.setdefault(key, initial)

    products, source, error = get_catalog()
    with st.sidebar:
        st.markdown("<div class='eyebrow'>FitKicks</div><h2 style='margin-top:.2rem'>Move in style.</h2>", unsafe_allow_html=True)
        st.caption("AI-powered footwear discovery")
        pages = ["Shop", "AI Style Match", "Support", "Bag", "Saved", "Account"]
        if (st.session_state.get("user") or {}).get("role") == "admin":
            pages.append("Admin")
        page = st.radio("Navigate", pages, label_visibility="collapsed", key="navigation")
        st.session_state.page = page
        st.caption(
            f"{sum(item['quantity'] for item in st.session_state.bag.values())} items in bag · "
            f"{len(st.session_state.saved)} saved"
        )
        st.divider()
        if source == "api":
            st.success(f"Live catalog · {len(products)} shoes")
        elif source == "local":
            st.warning("Offline demo catalog · session-only bag")
            st.caption("Start the backend and configure MongoDB to use live products and AI matching.")
        else:
            st.error(error)

    if source == "error":
        st.stop()
    if source == "local" and error:
        st.warning(f"Could not load live products; showing the bundled demo catalog instead. API detail: {error}")
    if not products:
        st.info("No products are available in the catalog.")
        return

    page = st.session_state.page
    if page == "Shop":
        shop_page(products, source)
        with st.expander("Save a shoe for later"):
            choices = {f"{p['name']} · {p['brand']}": p["id"] for p in products if p["id"] not in st.session_state.saved}
            if choices:
                selected = st.selectbox("Choose a shoe", list(choices), key="save-choice")
                if st.button("Save shoe"):
                    st.session_state.saved.append(choices[selected])
                    st.success("Saved to your list.")
            else:
                st.caption("All catalog shoes are already saved.")
    elif page == "AI Style Match":
        ai_page(products)
    elif page == "Support":
        support_page(products, source)
    elif page == "Bag":
        bag_page()
    elif page == "Saved":
        saved_page(products)
    elif page == "Admin":
        admin_page()
    else:
        account_page()

    st.markdown("<hr><div class='footnote'>FitKicks · Shoe prices are approximate. Verify current prices, availability, and product details with the brand.</div>", unsafe_allow_html=True)


main()
