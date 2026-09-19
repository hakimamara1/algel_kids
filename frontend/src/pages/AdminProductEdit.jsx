import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminApi, { apiErrorMessage } from '../lib/adminApi';

const PHOTO_TYPES = 'image/*,.heic,.heif';

const AdminProductEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [title, setTitle] = useState('');
    const [price, setPrice] = useState(0);
    const [compareAtPrice, setCompareAtPrice] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('girls-clothing');
    const [images, setImages] = useState([]); // Product level images
    const [colors, setColors] = useState([]); // Array of color objects
    const [offers, setOffers] = useState([]); // Pack prices: [{ quantity, price }]

    // UI State
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!id) return;
        adminApi.get(`/products/${id}`)
            .then(({ data }) => {
                setTitle(data.title);
                setPrice(data.price);
                setCompareAtPrice(data.compareAtPrice ?? '');
                setDescription(data.description || '');
                setCategory(data.category);
                setImages(data.images || []);
                setColors(data.colors || []);
                setOffers(data.offers || []);
            })
            .catch((error) => {
                console.error(error);
                alert(apiErrorMessage(error, 'Failed to load product'));
            });
    }, [id]);

    // Several photos at once (iPhone HEIC photos are converted to JPG by the server)
    const uploadFileHandler = async (e, section, colorIndex = null) => {
        const files = Array.from(e.target.files || []);
        e.target.value = ''; // allow choosing the same photo again
        if (!files.length) return;

        const formData = new FormData();
        files.forEach((file) => formData.append('images', file));
        setUploading(true);

        try {
            const { data } = await adminApi.post('/upload', formData);
            const newImages = data.images.map(({ publicId, url }) => ({ publicId, url }));

            if (section === 'main') {
                setImages((prev) => [...prev, ...newImages]);
            } else if (section === 'color' && colorIndex !== null) {
                setColors((prev) => prev.map((color, index) => (
                    index === colorIndex ? { ...color, images: [...(color.images || []), ...newImages] } : color
                )));
            }
        } catch (error) {
            console.error(error);
            alert(`Error: ${apiErrorMessage(error, 'Image upload failed')}`);
        } finally {
            setUploading(false);
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        const productData = {
            title,
            price,
            compareAtPrice: compareAtPrice === '' ? null : compareAtPrice,
            description,
            category,
            images,
            colors,
            // Empty rows are skipped; the server prices packs with these
            offers: offers
                .filter((offer) => offer.quantity !== '' && offer.price !== '')
                .map((offer) => ({ quantity: Number(offer.quantity), price: Number(offer.price) }))
        };

        try {
            if (isEdit) {
                await adminApi.put(`/products/${id}`, productData);
            } else {
                await adminApi.post('/products', productData);
            }
            navigate('/admin');
        } catch (error) {
            console.error(error);
            alert(apiErrorMessage(error, 'Action failed'));
            setLoading(false);
        }
    };

    // --- Pack offers (landing pages): the total price for 2, 3... pieces ---
    const addOffer = () => {
        const next = Math.min(5, Math.max(1, ...offers.map((offer) => Number(offer.quantity) || 1)) + 1);
        setOffers([...offers, { quantity: next, price: '' }]);
    };

    const updateOffer = (index, field, value) => {
        setOffers(offers.map((offer, i) => (i === index ? { ...offer, [field]: value } : offer)));
    };

    const removeOffer = (index) => {
        setOffers(offers.filter((_, i) => i !== index));
    };

    // --- Color Management ---
    const addColor = () => {
        setColors([...colors, { name: '', hexCode: '', images: [], sizes: [] }]);
    };

    const removeColor = (index) => {
        const newColors = [...colors];
        newColors.splice(index, 1);
        setColors(newColors);
    };

    const updateColorField = (index, field, value) => {
        const newColors = [...colors];
        newColors[index][field] = value;
        setColors(newColors);
    };

    // --- Size Management (Nested in Color) ---
    const addSize = (colorIndex) => {
        const newColors = [...colors];
        if (!newColors[colorIndex].sizes) newColors[colorIndex].sizes = [];
        newColors[colorIndex].sizes.push({ value: '', stock: 0 });
        setColors(newColors);
    };

    const removeSize = (colorIndex, sizeIndex) => {
        const newColors = [...colors];
        newColors[colorIndex].sizes.splice(sizeIndex, 1);
        setColors(newColors);
    };

    const updateSizeField = (colorIndex, sizeIndex, field, value) => {
        const newColors = [...colors];
        newColors[colorIndex].sizes[sizeIndex][field] = value;
        setColors(newColors);
    };

    // Remove Image Helper
    const removeImage = (section, index, colorIndex = null) => {
        if (section === 'main') {
            setImages(images.filter((_, i) => i !== index));
        } else if (section === 'color') {
            const newColors = [...colors];
            newColors[colorIndex].images.splice(index, 1);
            setColors(newColors);
        }
    };

    return (
        <div dir="ltr" className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-5xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Create Product'}</h1>
                    <button onClick={() => navigate('/admin')} className="text-gray-600 hover:text-gray-900">Cancel</button>
                </div>

                <form onSubmit={submitHandler} className="space-y-8">

                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-lg shadow space-y-4">
                        <h2 className="text-xl font-semibold border-b pb-2">Basic Info</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input className="w-full p-2 border rounded mt-1" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Price (DA)</label>
                                <input className="w-full p-2 border rounded mt-1" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Old price (DA, optional)</label>
                                <input className="w-full p-2 border rounded mt-1" type="number" min="0" placeholder="Shown crossed out" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <input className="w-full p-2 border rounded mt-1" type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea className="w-full p-2 border rounded mt-1" rows="3" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Pack offers */}
                    <div className="bg-white p-6 rounded-lg shadow space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <div>
                                <h2 className="text-xl font-semibold">Pack offers</h2>
                                <p className="text-sm text-gray-500">Total price for several pieces, used by landing pages (e.g. 2 pieces = 7000 DA). Without an offer, each piece costs the price above.</p>
                            </div>
                            <button type="button" onClick={addOffer} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded whitespace-nowrap">+ Add Offer</button>
                        </div>
                        {offers.length === 0 && <p className="text-sm text-gray-400">No pack offers.</p>}
                        {offers.map((offer, index) => {
                            const regular = Number(price) * Number(offer.quantity);
                            const saving = regular - Number(offer.price);
                            return (
                                <div key={index} className="flex flex-wrap items-end gap-3">
                                    <label className="block">
                                        <span className="block text-sm font-medium text-gray-700">Pieces</span>
                                        <input type="number" min="2" max="5" className="w-24 p-2 border rounded mt-1" value={offer.quantity} onChange={(e) => updateOffer(index, 'quantity', e.target.value)} />
                                    </label>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-gray-700">Total price (DA)</span>
                                        <input type="number" min="0" className="w-40 p-2 border rounded mt-1" value={offer.price} onChange={(e) => updateOffer(index, 'price', e.target.value)} />
                                    </label>
                                    {offer.price !== '' && saving > 0 && <span className="text-sm text-green-700 pb-2">Customer saves {saving} DA</span>}
                                    <button type="button" onClick={() => removeOffer(index)} className="text-red-600 text-sm pb-2">Remove</button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Main Images */}
                    <div className="bg-white p-6 rounded-lg shadow space-y-4">
                        <h2 className="text-xl font-semibold border-b pb-2">Product Images</h2>
                        <div className="flex flex-wrap gap-4">
                            {images.map((img, idx) => (
                                <div key={img.publicId || idx} className="relative w-24 h-24">
                                    <img src={img.url} alt="" className="w-full h-full object-cover rounded" />
                                    <button type="button" onClick={() => removeImage('main', idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center" aria-label="Remove photo">×</button>
                                </div>
                            ))}
                            <div className="w-24 h-24 border-2 border-dashed flex items-center justify-center rounded cursor-pointer relative hover:border-blue-500">
                                <span className="text-3xl text-gray-400">+</span>
                                <input type="file" multiple accept={PHOTO_TYPES} className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => uploadFileHandler(e, 'main')} aria-label="Add product photos" />
                            </div>
                        </div>
                        {uploading && <p className="text-sm text-blue-500">Uploading...</p>}
                    </div>

                    {/* Variants */}
                    <div className="bg-white p-6 rounded-lg shadow space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h2 className="text-xl font-semibold">Color Variants</h2>
                            <button type="button" onClick={addColor} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded">+ Add Color</button>
                        </div>

                        {colors.map((color, cIdx) => (
                            <div key={cIdx} className="border p-4 rounded bg-gray-50 space-y-4">
                                <div className="flex justify-between">
                                    <h4 className="font-bold">Variant #{cIdx + 1}</h4>
                                    <button type="button" onClick={() => removeColor(cIdx)} className="text-red-600 text-sm">Remove Variant</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="Color Name (e.g. Pink)" className="p-2 border rounded" value={color.name} onChange={(e) => updateColorField(cIdx, 'name', e.target.value)} />
                                    <input placeholder="Hex Code (e.g. #FF0000)" className="p-2 border rounded" value={color.hexCode} onChange={(e) => updateColorField(cIdx, 'hexCode', e.target.value)} />
                                </div>

                                {/* Color Images */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">Variant Images</label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {color.images?.map((img, imgIdx) => (
                                            <div key={img.publicId || imgIdx} className="relative w-16 h-16">
                                                <img src={img.url} alt="" className="w-full h-full object-cover rounded" />
                                                <button type="button" onClick={() => removeImage('color', imgIdx, cIdx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center" aria-label="Remove photo">×</button>
                                            </div>
                                        ))}
                                        <div className="w-16 h-16 border-2 border-dashed flex items-center justify-center rounded relative">
                                            <span className="text-gray-400">+</span>
                                            <input type="file" multiple accept={PHOTO_TYPES} className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => uploadFileHandler(e, 'color', cIdx)} aria-label="Add photos for this color" />
                                        </div>
                                    </div>
                                </div>

                                {/* Sizes */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-medium text-gray-500 uppercase">Sizes</label>
                                        <button type="button" onClick={() => addSize(cIdx)} className="text-xs bg-gray-200 px-2 py-1 rounded">+ Add Size</button>
                                    </div>
                                    <div className="space-y-2">
                                        {color.sizes?.map((size, sIdx) => (
                                            <div key={sIdx} className="flex gap-2 items-center">
                                                <input placeholder="Size (e.g. S)" className="p-1 border rounded w-20" value={size.value} onChange={(e) => updateSizeField(cIdx, sIdx, 'value', e.target.value)} />
                                                <input placeholder="Stock" type="number" min="0" className="p-1 border rounded w-20" value={size.stock} onChange={(e) => updateSizeField(cIdx, sIdx, 'stock', e.target.value)} />
                                                <button type="button" onClick={() => removeSize(cIdx, sIdx)} className="text-red-500 text-xs" aria-label="Remove size">×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={loading || uploading} className="bg-black text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-800 transition disabled:opacity-60">
                            {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AdminProductEdit;
