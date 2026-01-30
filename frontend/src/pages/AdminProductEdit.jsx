import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminProductEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [title, setTitle] = useState('');
    const [price, setPrice] = useState(0);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('girls-clothing');
    const [images, setImages] = useState([]); // Product level images
    const [colors, setColors] = useState([]); // Array of color objects

    // UI State
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            const { data } = await axios.get(`https://algel-kids.onrender.com/api/products/${id}`);
            setTitle(data.title);
            setPrice(data.price);
            setDescription(data.description);
            setCategory(data.category);
            setImages(data.images || []);
            setColors(data.colors || []);
        } catch (error) {
            console.error(error);
            alert('Failed to load product');
        }
    };

    const uploadFileHandler = async (e, section, colorIndex = null) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);
        setUploading(true);

        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            const { data } = await axios.post('https://algel-kids.onrender.com/api/upload', formData, config);

            const newImage = { publicId: data.publicId, url: data.url };

            if (section === 'main') {
                setImages([...images, newImage]);
            } else if (section === 'color' && colorIndex !== null) {
                const newColors = [...colors];
                newColors[colorIndex].images = [...(newColors[colorIndex].images || []), newImage];
                setColors(newColors);
            }
            setUploading(false);
        } catch (error) {
            console.error(error);
            setUploading(false);
            alert('Image Upload Failed');
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        const productData = {
            title,
            price,
            description,
            category,
            images,
            colors
        };

        try {
            if (isEdit) {
                await axios.put(`https://algel-kids.onrender.com/api/products/${id}`, productData);
            } else {
                await axios.post('https://algel-kids.onrender.com/api/products', productData);
            }
            navigate('/admin');
        } catch (error) {
            console.error(error);
            alert('Action failed');
            setLoading(false);
        }
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
        <div className="min-h-screen bg-gray-50 pb-20">
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
                                <label className="block text-sm font-medium text-gray-700">Price</label>
                                <input className="w-full p-2 border rounded mt-1" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea className="w-full p-2 border rounded mt-1" rows="3" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <input className="w-full p-2 border rounded mt-1" type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Main Images */}
                    <div className="bg-white p-6 rounded-lg shadow space-y-4">
                        <h2 className="text-xl font-semibold border-b pb-2">Product Images</h2>
                        <div className="flex flex-wrap gap-4">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative w-24 h-24">
                                    <img src={img.url} className="w-full h-full object-cover rounded" />
                                    <button type="button" onClick={() => removeImage('main', idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">×</button>
                                </div>
                            ))}
                            <div className="w-24 h-24 border-2 border-dashed flex items-center justify-center rounded cursor-pointer relative hover:border-blue-500">
                                <span className="text-3xl text-gray-400">+</span>
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => uploadFileHandler(e, 'main')} />
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
                                            <div key={imgIdx} className="relative w-16 h-16">
                                                <img src={img.url} className="w-full h-full object-cover rounded" />
                                                <button type="button" onClick={() => removeImage('color', imgIdx, cIdx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">×</button>
                                            </div>
                                        ))}
                                        <div className="w-16 h-16 border-2 border-dashed flex items-center justify-center rounded relative">
                                            <span className="text-gray-400">+</span>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => uploadFileHandler(e, 'color', cIdx)} />
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
                                                <input placeholder="Stock" type="number" className="p-1 border rounded w-20" value={size.stock} onChange={(e) => updateSizeField(cIdx, sIdx, 'stock', e.target.value)} />
                                                <button type="button" onClick={() => removeSize(cIdx, sIdx)} className="text-red-500 text-xs">×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" className="bg-black text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-800 transition">
                            {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AdminProductEdit;
