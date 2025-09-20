const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'pages')));

app.use(session({
    secret: 'jeronimo-super-key', // signs cookies so they cant be messed with
    resave: false, // no saving if no changes made to db
    saveUninitialized: false, // no empty sessions for users who dont log in
    store: MongoStore.create({mongoUrl: process.env.MONGO_URI}) // saves into mongodb instead of memory
}))

const User = mongoose.model('User', new mongoose.Schema({
    email: {type: String, unique: true, required: true},
    passwordHash: String,
    displayName: String,
    role: {type: String, default: 'user'}
}));

app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'pages', 'mainPage.html')) // if logged in, then go to main page
    } else {
        res.sendFile(path.join(__dirname, 'pages', 'loginPage.html')); // if not, send them to log in page
    }
});

app.post('/api/login', async (req, res) => {
    const {email, password} = req.body;
    let user = await User.findOne({email});

    if (!user) {
        return res.status(401).json({error: 'Incorrect Email or Password'});
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        return res.status(401).json({ error: 'Incorrect Email or Password'});
    }

    req.session.userId = user._id;
    req.session.user = {id: user._id, displayName: user.displayName};

    res.json({success: true});
});

app.post('/api/signup', async (req, res) => {
    const {email, password} = req.body;
    let user = await User.findOne({email});

    if (user) {
        return res.status(400).json({error: "Account Already Exists"})
    }

    const hash = await bcrypt.hash(password, 10);
    user = await User.create ({
        email,
        passwordHash: hash,
        displayName: email
    });

    req.session.userId = user._id;
    req.session.user = {id: user._id, displayName: user.displayName};

    res.json({success: true});
})

app.get('/api/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({error: 'Not Logged In'});
    }
    res.json(req.session.user);
});


const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(PORT, () => console.log(`Server starting on port ${PORT}`))
    })
    .catch(err => console.error("Mongo connection failed: ", err));



