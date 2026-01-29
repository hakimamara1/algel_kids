require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/productModel');

const seedData = [
    {
        title: "Princess Pink Party Dress",
        slug: "princess-pink-party-dress",
        price: 49.99,
        description: "A beautiful handmade dress for special occasions. Detailed embroidery and soft fabric for your little princess.",
        category: "girls-clothing",
        colors: [
            {
                name: "Pink",
                hexCode: "#FFC0CB",
                images: [
                    { publicId: "demo/pink1", url: "https://res.cloudinary.com/demo/image/upload/v1652345/dress_pink_1.jpg", isMain: true },
                    { publicId: "demo/pink2", url: "https://res.cloudinary.com/demo/image/upload/v1652345/dress_pink_2.jpg", isMain: false }
                ],
                sizes: [
                    { value: "2Y", stock: 5 },
                    { value: "4Y", stock: 3 }
                ]
            },
            {
                name: "Blue",
                hexCode: "#87CEEB",
                images: [
                    { publicId: "demo/blue1", url: "https://res.cloudinary.com/demo/image/upload/v1652345/dress_blue_1.jpg", isMain: true }
                ],
                sizes: [
                    { value: "3Y", stock: 2 },
                    { value: "5Y", stock: 4 }
                ]
            }
        ]
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        await Product.deleteMany({});
        console.log("Old products removed");

        await Product.insertMany(seedData);
        console.log("Sample product inserted");

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
