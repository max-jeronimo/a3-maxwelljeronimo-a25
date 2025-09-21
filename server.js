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
    saveUninitialized: false, // no empty sessions for users who don't log in
    store: MongoStore.create({mongoUrl: process.env.MONGO_URI}) // saves into mongodb instead of memory
}))

// Schemas
const User = mongoose.model('User', new mongoose.Schema({
    email: {type: String, unique: true, required: true},
    passwordHash: String,
    displayName: String,
    role: {type: String, default: 'user'}
}));

const Game = mongoose.model('Game', new mongoose.Schema( {
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    partner: {type: String, default: ""},
    opponents: [String],
    myScore: {type: Number, required: true},
    opponentScore: {type: Number, required: true},
    date: {type: Date, default: Date.now},
}));

// Routes

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



app.get('/api/games', async (req, res) => {
    if (!req.session.user)
        return res.status(401).json({error: 'Not Logged In'});

    const games = await Game.find({userId: req.session.userId});
    res.json(games);
})

app.post('/api/games', async (req, res) => {
    if (!req.session.userId)
        return res.status(401).json({error: "Not Logged In"});

    const {partner, opponents, myScore, opponentScore} = req.body;

    if (!opponents || opponents.trim() === "") {
        return res.status(400).json({error: "At least one opponent is required"});
    }
    if (isNaN(parseInt(myScore)) || isNaN(parseInt(opponentScore))) {
        return res.status(400).json({error: "Scores must be numbers"});
    }
    try {
        const game = await Game.create({
            userId: req.session.userId,
            partner: partner || "",
            opponents: opponents.split(',').map(o => o.trim()),
            myScore: parseInt(myScore),
            opponentScore: parseInt(opponentScore),
        })
        return res.json(game);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server Error Creating Game"})
    }
})

app.put('/api/games/:id', async (req, res) => {
    if (!req.session.userId)
        return res.status(401).json({error: 'Not Logged In'});

    const {id} = req.params;
    const {partner, opponents, myScore, opponentScore} = req.body;

    if (!opponents || opponents.trim() === "") {
        return res.status(400).json({error: "At least one opponent is required"});
    }

    const game = await Game.findOneAndUpdate(
        {_id: id, userId: req.session.userId},
        {
            partner: partner || "",
            opponents: opponents.split(',').map(o => o.trim()),
            myScore: parseInt(myScore),
            opponentScore: parseInt(opponentScore),
        },
        {new: true}
    );

    if (!game)
        return res.status(404).json({error: "Game not Found"})
    res.json(game);
});

app.delete('/api/games/:id', async (req, res) => {
    if (!req.session.userId)
        return res.status(401).json({error: 'Not Logged In'});

    const {id} = req.params;
    const result = await Game.deleteOne({_id: id, userId: req.session.userId});

    if (result.deletedCount === 0) {
        return res.status(404).json({error: "Game not Found"});
    }
    res.json({success: true});
});

const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(PORT, () => console.log(`Server starting on port ${PORT}`))
    })
    .catch(err => console.error("Mongo connection failed: ", err));



