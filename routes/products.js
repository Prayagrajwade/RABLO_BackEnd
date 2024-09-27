import express from 'express';
import Product from '../models/Products.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { check, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';

const router = express.Router();

// User Registration
router.post(
    '/register',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            // Check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ msg: 'User already exists' });
            }

            user = new User({ name, email, password });
            await user.save();

            // Generate JWT token
            const payload = { user: { id: user.id } };
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
                if (err) throw err;
                return res.json({ msg: 'Registration successful', token });
            });
        } catch (err) {
            console.error(err); // Log the error for debugging
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// User Login
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Check for user
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            // Check if password matches
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            // Generate JWT token
            const payload = { user: { id: user.id } };
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
                if (err) throw err;
                return res.json({ msg: 'Login successful', token });
            });
        } catch (err) {
            console.error(err); // Log the error for debugging
            res.status(500).json({ error: 'Server error' });
        }
    }
);


// 1. Add a Product
router.post('/createProduct', auth, async (req, res) => {
    try {
        const { productId, name, price, featured, rating, company } = req.body;

        const newProduct = new Product({
            productId,
            name,
            price,
            featured,
            rating,
            company,
        });

        const product = await newProduct.save();
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. Get All Products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/productByid/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 3. Update a Product
router.put('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) return res.status(404).json({ msg: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 4. Delete a Product
router.delete('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ msg: 'Product not found' });
        res.json({ msg: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 5. Fetch Featured Products
router.get('/featured', async (req, res) => {
    try {
        const featuredProducts = await Product.find({ featured: true });
        res.json(featuredProducts);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 6. Fetch Products with Price Less Than
router.get('/price/:value', async (req, res) => {
    try {
        const products = await Product.find({ price: { $lt: req.params.value } });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 7. Fetch Products with Rating Higher Than
router.get('/rating/:value', async (req, res) => {
    try {
        const products = await Product.find({ rating: { $gt: req.params.value } });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 8. Logout route (Optional backend logic)
router.post('/logout', auth, (req, res) => {
    // You don't necessarily need to invalidate the token on the server side.
    // In the client, you should remove the token from local storage or cookie.
    res.json({ msg: 'Logged out successfully' });
});

router.get('/filtered', async (req, res) => {
    const { price, rating, featured } = req.query;
    const query = {};
  
    // Add filters to query object if they exist
    if (price) {
      query.price = { $lte: price };
    }
    if (rating) {
      query.rating = { $gt: rating };
    }
    if (featured) {
      query.featured = featured === 'true'; // Convert string to boolean
    }
  
    try {
      const products = await Product.find(query);
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
});
export default router;
