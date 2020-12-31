// Imports
const express = require('express');
const mongodb = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');

// Router instance
const router = express.Router();

/** 
 * @name Routes
 * @description User routes
 * 
*/
// Get Route
router.get('/', async (req, res) => {
    const users = await loadUsers();
    res.send(await users.find({}).toArray());
});

// Post New User Route
router.post('/register', async (req, res) => {
    try {
        const users = await loadUsers();
        // Check if email is in use or passwords do not match
        let emailCheck = await users.findOne({ email: req.body.email });
        if (emailCheck) {
            res.status(400).json({
                msg: "That email is already in use."
            });
            return;
        }
        if (req.body.password != req.body.confirmed_password) {
            res.status(400).json({
                msg: "Passwords do not match."
            });
            return;
        }

        // Hash password and insert user
        bcrypt.hash(req.body.password, 10, async function(err, hash) {
            var hashPassword = hash;
            
            await users.insertOne({
                name: req.body.name,
                email: req.body.email,
                password: hashPassword,
                created_at: new Date()
            });
        });

        res.status(201).json({
            msg: `New User: ${req.body.name} has been created`
        });
    } catch(err) {
        console.log(err);
    }
});

// Post Login User Route
router.post('/login', async (req, res) => {
    try {
        const users = await loadUsers();
        const user = await users.findOne({ name: req.body.name });

        if(!user) {
            console.log('error user');
            return res.status(400).json({ msg: "The username does not exist" });
        }
        const passwordCompare = bcrypt.compareSync(req.body.password, user.password);
        if(!passwordCompare) {
            console.log('error compare');
            return res.status(400).json({ msg: "The password is invalid" });
        }
        
        // User is accepted, sign web token
        const payload = {
            _id: user._id,
            name: user.name,
            email: user.email
        }
        jwt.sign(payload, process.env.SECRET, { 
            expiresIn: 604800 
        }, (err, token) => {
            console.log(token)
            if (err) {
                console.log(err)
                return res.status(500).json({
                    msg: err
                });
            }

            return res.status(200).json({
                success: true,
                token: `Bearer ${token}`,
                msg: "You are logged in"
            });
        });
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

// Delete User Route (requires id param)
router.delete('/:id', async (req, res) => {
    try {
        const users = await loadUsers();
        await users.deleteOne({ _id: mongodb.ObjectID(req.params.id) });

        res.status(200).json({
            msg: "User has been delted"
        });
    } catch (err) {
        console.log(err);
    }
});

// Database users client
async function loadUsers() {
    const client = await mongodb.MongoClient.connect(process.env.DATABASE_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    return client.db('dev_db').collection('users');
}

// Export router
module.exports = router;