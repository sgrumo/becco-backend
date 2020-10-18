/* eslint-disable security/detect-object-injection */
const router = require('express').Router();
const auth = require('../auth');
const mongoose = require('mongoose');
const nanoid = require('nanoid');

const Users = mongoose.model('Users');

let matches = [];

const matchVisibility = {
    PRIVATE: 'private',
    PUBLIC: 'public'
};

router.get('/', auth.required, (_, res) => {
    res.send(matches.map(match => ({ author: match.author, numPlayers: match.numPlayers, name: match.name, visibility: match.visibility, id: match.id })));
});

router.get('/:id', auth.required, (req, res) => {
    res.send(matches);
});

// Joinare match
router.patch('/', auth.required, (req, res) => {
    const userID = req.payload.id;
    const data = req.body;
    const match = matches.find(value => value.id === data.id);

    if (!match) {
        return res.status(422).json({ message: 'Match non trovato' });
    }

    if (match.numPlayers === 4) {
        return res.status(422).json({ message: 'Partita già piena, refresha per ottenere una nuova lista di partite.' });
    }

    return Users.findById(userID)
        .then((user) => {

            if (!user) {
                return res.status(400).json({ message: 'Ma che cazzo è successo' });
            }

            if (match.players.includes(user.username)) {
                return res.status(422).json({ message: 'Idiota stai già partecipando' });
            }
            if (match.visibility === matchVisibility.PRIVATE && match.password !== data.password) {
                return res.status(422).json({ message: 'Password non corretta' });
            } else {
                match.players.push(user.username);
                match.numPlayers++;
                return res.json({ message: 'Eccellente' });
            }
        });
});

// Creazione una nuova partita
router.post('/', auth.required, (req, res) => {
    const { payload: { id } } = req;
    const match = req.body;

    if (!match.visibility || !Object.values(matchVisibility).includes(match.visibility)) {
        return res.status(422).json({ message: 'Visibilità del match non valida' });
    }

    if (!match.name) {
        return res.status(422).json({ message: 'Nome della partita non inserito' });
    }

    if (!match.name.length > 25) {
        return res.status(422).json({ message: 'Nome della partita troppo lungo' });
    }

    if (match.visibility === matchVisibility.private && !match.password) {
        return res.status(422).json({ message: 'Password non settata' });
    }

    const findIndex = matches.findIndex(value => value.name === match.name);

    if (findIndex !== -1) {
        return res.status(422).json({ message: 'Partita con lo stesso nome già creata, per favore cambia il nome.' });
    }

    return Users.findById(id)
        .then((user) => {
            if (!user) {
                return res.status(400).json({ message: 'Ma che cazzo è successo' });
            }
            const index = matches.findIndex(value => value.players.includes(user.username));

            if (index !== -1) {
                return res.status(422).json({ message: 'Stai già partecipando ad una partita!' });
            }

            match.author = user.username;
            match.numPlayers = 1;
            match.players = [match.author];
            match.id = nanoid.nanoid(parseInt(process.env.NANOID_LENGTH));
            matches.push(match);
            return res.status(201).json({ id: match.id, message: 'Partita creata con successo' });
        });

});

router.delete('/', auth.required, (req, res) => {
    matches = [];
    res.send({ message: 'Azzerati' });
});

// Cancellazione partita
router.delete('/:id', auth.required, (req, res) => {
    const userID = req.payload.id;
    const matchID = req.params.id;

    const matchIndex = matches.find(value => value.id === matchID);

    if (matchIndex === -1) {
        return res.status(422).json({ message: 'Partita non trovata' });
    }

    return Users.findById(userID)
        .then((user) => {
            if (!user) {
                return res.status(400).json({ message: 'Ma che cazzo è successo' });
            }
            if (matches[matchIndex].author !== user.username) {
                return res.status(405).json({ message: 'Questa partita è stata creata da un altro giocatore, non puoi fare sta cosa idiota' });
            }

            matches = matches.splice(matchIndex, 1);

            return res.json({ message: 'Partita cancellata ' });
        });


});

module.exports = router;