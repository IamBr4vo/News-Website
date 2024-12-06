const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;
const User = require('../models/user.model');

// Renderizar formulario de login
router.get('/', (req, res) => {
    res.render('users/login', {error: null, user: null, email: ''});
});

// Manejar inicio de sesión
router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).render('users/login', { error: 'Usuario no encontrado', email, user: null});
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).render('users/login', { error: 'Contraseña incorrecta', email, user: null});
        }

        const token = jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });

        if (user.role === 'admin') {
            return res.redirect('/users/admin-dashboard');
        } else {
            return res.redirect('/news');
        }
    } catch (err) {
        res.status(500).render('users/login', { error: 'Ocurrió un error. Intenta nuevamente.', email });
    }
});
// Cerrar sesión
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

module.exports = router;
