import { useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function AdminProductForm({ onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "",
        shoeType: "sneakers",
        gender: "unisex",
        stock: 10,
        isTrending: false,
        isFeatured: false,
    });

    const [images, setImages] = useState([]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const data = new FormData();

            Object.keys(form).forEach((key) => {
                data.append(key, form[key]);
            });

            for (let img of images) {
                data.append("images", img);
            }

            await api.post("/products", data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            toast.success("Product Added Successfully");

            onSuccess?.();
            onClose?.();

        } catch (err) {
            console.error(err);
            toast.error("Failed to add product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-dark-200 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Add Product</h2>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <input
                        type="text"
                        name="name"
                        placeholder="Product Name"
                        value={form.name}
                        onChange={handleChange}
                        className="input-field w-full"
                        required
                    />

                    <textarea
                        name="description"
                        placeholder="Description"
                        value={form.description}
                        onChange={handleChange}
                        className="input-field w-full h-28"
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">

                        <input
                            type="number"
                            name="price"
                            placeholder="Price"
                            value={form.price}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />

                        <input
                            type="number"
                            name="stock"
                            placeholder="Stock"
                            value={form.stock}
                            onChange={handleChange}
                            className="input-field"
                        />

                    </div>

                    <div className="grid grid-cols-2 gap-4">

                        <select
                            name="shoeType"
                            value={form.shoeType}
                            onChange={handleChange}
                            className="input-field"
                        >
                            <option value="sneakers">Sneakers</option>
                            <option value="running">Running</option>
                            <option value="sports">Sports</option>
                            <option value="casual">Casual</option>
                            <option value="formal">Formal</option>
                        </select>

                        <select
                            name="gender"
                            value={form.gender}
                            onChange={handleChange}
                            className="input-field"
                        >
                            <option value="men">Men</option>
                            <option value="women">Women</option>
                            <option value="unisex">Unisex</option>
                            <option value="kids">Kids</option>
                        </select>

                    </div>

                    <input
                        type="file"
                        multiple
                        onChange={(e) => setImages([...e.target.files])}
                        className="input-field w-full"
                    />

                    <div className="flex gap-4">

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="isTrending"
                                checked={form.isTrending}
                                onChange={handleChange}
                            />
                            Trending
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="isFeatured"
                                checked={form.isFeatured}
                                onChange={handleChange}
                            />
                            Featured
                        </label>

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? "Adding Product..." : "Add Product"}
                    </button>

                </form>
            </div>
        </div>
    );
}