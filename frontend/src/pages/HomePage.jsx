import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await axios.get('http://192.168.179.237:5002/api/products');
                setProducts(data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load products');
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading products...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Collection</h1>

                {products.length === 0 ? (
                    <div className="text-center text-gray-500">No products found.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product) => {
                            // Find the first available image, either top-level or from the first color
                            let displayImage = null;
                            if (product.images && product.images.length > 0) {
                                displayImage = product.images[0].url;
                            } else if (product.colors && product.colors.length > 0 && product.colors[0].images && product.colors[0].images.length > 0) {
                                displayImage = product.colors[0].images[0].url;
                            }

                            return (
                                <Link
                                    to={`/product/${product._id}`}
                                    key={product._id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 block"
                                >
                                    <div className="h-64 bg-gray-200 w-full overflow-hidden">
                                        {displayImage ? (
                                            <img
                                                src={displayImage}
                                                alt={product.title}
                                                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h2 className="text-lg font-semibold text-gray-800 mb-1 truncate">{product.title}</h2>
                                        <p className="text-pink-600 font-bold">${product.price}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;
