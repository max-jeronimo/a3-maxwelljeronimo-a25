const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'pages')));

app.use(session({
    secret: 'jeronimo-super-key', // signs cookies so they cant be messed with
    resave: false, // no saving if no changes made to db
    saveUninitialized: false, // no empty sessions for users who don't log in
    store: MongoStore.create({mongoUrl: process.env.MONGO_URI}), // saves into mongodb instead of memory
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}))

// Schemas
const User = mongoose.model('User', new mongoose.Schema({
    email: {type: String, unique: true, required: true},
    passwordHash: String,
    displayName: String,
    role: {type: String, default: 'user'}
}));

const Game = mongoose.model('Game', new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    gameType: {type: String, required: true},
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

// LOGIN
app.post('/api/login', async (req, res) => {
    const {email, password} = req.body;
    let user = await User.findOne({email});

    if (!user) {
        return res.status(401).json({error: 'Incorrect Email or Password'});
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        return res.status(401).json({error: 'Incorrect Email or Password'});
    }

    req.session.userId = user._id;
    req.session.user = {
        id: user._id,
        displayName: user.displayName,
        role: user.role
    }


    res.json({success: true});
});

// LOGOUT
app.post('/api/logout', async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout Failed", err);
            return res.status(500).json({error: "Logout Failed"});
        }
        res.clearCookie('connect.sid');
        res.json({success: true});
    })
})

// SIGNUP
app.post('/api/signup', async (req, res) => {
    const {email, password} = req.body;
    let user = await User.findOne({email});

    if (user) {
        return res.status(400).json({error: "Account Already Exists"})
    }

    const hash = await bcrypt.hash(password, 10);
    user = await User.create({
        email,
        passwordHash: hash,
        displayName: email
    });

    req.session.userId = user._id;
    req.session.user = {
        id: user._id,
        displayName: user.displayName,
        role: user.role
    }

    res.json({success: true});
})

// USER GAMES
app.get('/api/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({error: 'Not Logged In'});
    }
    console.log("Current Session User: ", req.session.userId);
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

    const {gameType, partner, opponents, myScore, opponentScore} = req.body;

    if (!gameType) {
        return res.status(400).json({error: "Game type is required"});
    }
    if (!opponents || opponents.trim() === "") {
        return res.status(400).json({error: "At least one opponent is required"});
    }
    if (isNaN(parseInt(myScore)) || isNaN(parseInt(opponentScore))) {
        return res.status(400).json({error: "Scores must be numbers"});
    }
    try {
        const game = await Game.create({
            userId: req.session.userId,
            gameType,
            partner: partner || "",
            opponents: opponents.split(',').map(o => o.trim()),
            myScore: parseInt(myScore),
            opponentScore: parseInt(opponentScore),
        });
        return res.json(game);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server Error Creating Game"});
    }
});

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


// LEADERBOARD PAGE

app.get('/api/stats', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({error: "Not Logged In"});
    }

    try {
        const games = await Game.find({}).populate('userId', 'displayName');

        const stats = {};

        games.forEach(game => {
            const userId = game.userId._id.toString();
            const displayName = game.userId.displayName;

            if (!stats[userId]) {
                stats[userId] = {
                    userId,
                    displayName,
                    totalGames: 0,
                    wins: 0,
                    losses: 0,
                    ties: 0,
                    byGameType: {}
                };
            }

            stats[userId].totalGames++;

            if (game.myScore > game.opponentScore) stats[userId].wins++;
            else if (game.myScore < game.opponentScore) stats[userId].losses++;
            else stats[userId].ties++;

            if (!stats[userId].byGameType[game.gameType]) {
                stats[userId].byGameType[game.gameType] = {wins: 0, losses: 0, ties: 0, total: 0};
            }

            stats[userId].byGameType[game.gameType].total++;
            if (game.myScore > game.opponentScore) stats[userId].byGameType[game.gameType].wins++;
            else if (game.myScore < game.opponentScore) stats[userId].byGameType[game.gameType].losses++;
            else stats[userId].byGameType[game.gameType].ties++;
        });

        res.json(Object.values(stats));
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server Error Calculating Stats"});
    }
});


app.get('/api/my/stats', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({error: "Not Logged In"});
    }
    try {
        const userId = req.session.userId;
        const games = await Game.find({userId});

        const stats = {
            totalGames: games.length,
            wins: 0,
            losses: 0,
            ties: 0,
            byGameType: {}
        };

        games.forEach(game => {
            if (game.myScore > game.opponentScore) stats.wins++;
            else if (game.myScore < game.opponentScore) stats.losses++;
            else stats.ties++;

            if (!stats.byGameType[game.gameType]) {
                stats.byGameType[game.gameType] = {wins: 0, losses: 0, ties: 0, total: 0};
            }

            stats.byGameType[game.gameType].total++;
            if (game.myScore > game.opponentScore) stats.byGameType[game.gameType].wins++;
            else if (game.myScore < game.opponentScore) stats.byGameType[game.gameType].losses++;
            else stats.byGameType[game.gameType].ties++;
        });

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server Error Calculating Stats"});
    }
});


// ACCOUNT PAGE

app.get('/yourAccount.html', (req, res) => {
    if (!req.session.user)
        return res.status(401).json({error: 'Not Logged In'});
    res.sendFile(path.join(__dirname, 'pages', 'yourAccount.html'));
});

// ACCOUNT SETTINGS

app.get('/api/my/account', async (req, res) => {
    if (!req.session.user)
        return res.status(401).json({error: 'Not Logged In'});
    try {
        const user = await User.findById(req.session.userId, 'displayName email');
        if (!user) return res.status(404).json({error: "User not found"});
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server Error Fetching Account"});
    }
});

// UPDATE DISPLAY NAME
app.put(`/api/my/account/displayName`, async (req, res) => {
    if (!req.session.user)
        return res.status(401).json({error: 'Not Logged In'});

    try {
        const user = await User.findByIdAndUpdate(
            req.session.userId,
            {displayName: req.body.displayName},
            {new: true, select: 'displayName email'});
        res.json({success: true, user});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server Error Updating Display Name"});
    }
})

// UPDATE EMAIL
app.put(`/api/my/account/email`, async (req, res) => {
    if (!req.session.user)
        return res.status(401).json({error: 'Not Logged In'});

    try {
        const user = await User.findByIdAndUpdate(
            req.session.userId,
            {email: req.body.email},
            {new: true, select: 'displayName email'});
        res.json({success: true, user});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server Error Updating Email"});
    }
})

// UPDATE PASSWORD
app.put(`/api/my/account/password`, async (req, res) => {
    if (!req.session.user)
        return res.status(401).json({error: 'Not Logged In'});

    const {oldPassword, newPassword} = req.body;

    try {
        const user = await User.findById(req.session.userId);
        if (!user)
            return res.status(404).json({error: "User not found"});

        const valid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!valid)
            return res.status(400).json({error: "Old Password does not Match."});

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server Error Updating Password."})
    }
})

// ADMIN PAGE
app.get('/adminPage.html', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send("Unauthorized Access");
    }
    res.sendFile(path.join(__dirname, 'pages', 'adminPage.html'));
});


// ADMIN USERS
app.get('/api/admin/users', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({error: "Unauthorized"});
    }
    const users = await User.find({}, 'email displayName role');
    res.json(users);
})

app.put('/api/admin/users/:id/promote', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({error: 'Unauthorized'});
    }
    await User.findByIdAndUpdate(req.params.id, {role: 'admin'});
    res.json({success: true});
});

app.put('/api/admin/users/:id/demote', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({error: 'Unauthorized'});
    }

    await User.findByIdAndUpdate(req.params.id, {role: 'user'});
    res.json({success: true});
});

app.delete('/api/admin/users/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({error: 'Unauthorized'});
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({success: true});
});

// ADMIN GAMES
app.get('/api/admin/games', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({error: "Unauthorized"});
    }
    try {
        const games = await Game.find({}).populate('userId', 'displayName');
        res.json(games);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server Error Fetching Games"});
    }
});

app.get('/api/admin/games/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({error: 'Unauthorized'});
    }
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({error: "Game Not Found"});
        res.json(game);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server Error Fetching Game"});
    }
});

app.put('/api/admin/games/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({error: 'Unauthorized'});
    }

    const {partner, opponents, myScore, opponentScore} = req.body;

    if (!opponents || opponents.trim() === "") {
        return res.status(400).json({error: "At least one opponent is required."});
    }

    try {
        const game = await Game.findByIdAndUpdate(
            req.params.id,
            {
                partner: partner || "",
                opponents: opponents.split(',').map(o => o.trim()),
                myScore: parseInt(myScore),
                opponentScore: parseInt(opponentScore),
            },
            {new: true}
        );
        if (!game) return res.status(404).json({error: "Game not Found"});
        res.json(game);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server Error Updating Game"});
    }
});

app.delete('/api/admin/games/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({error: 'Unauthorized'});
    }
    try {
        const result = await Game.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({error: "Game not Found"});
        res.json({success: true});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server Error Deleting Game"});
    }
});
// SERVER
const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(PORT, () => console.log(`Server starting on port ${PORT}`))
    })
    .catch(err => console.error("Mongo connection failed: ", err));
