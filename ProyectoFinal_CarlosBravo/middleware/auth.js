const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const SECRET = process.env.JWT_SECRET;

exports.protect = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login'); // Redirige si no hay token
    }

    try {
        // Decodificar el token
        const decoded = jwt.verify(token, SECRET);

        // Buscar al usuario en la base de datos usando el ID del token
        const user = await User.findById(decoded.id);
 
        if (!user || !user.role) {
            return res.redirect('/login'); // Redirige si el usuario no existe
        }

        // Adjuntar el usuario al objeto `req`
        req.user = user;
        next();
    } catch (err) {
        console.error('Error al verificar el token:', err);
        return res.redirect('/login'); // Redirige si el token no es válido
    }
};


exports.adminOnly = (req, res, next) => {
    // Asegurarse de que `req.user` existe
    if (!req.user) {
        return res.redirect('/login');
    }

    // Verificar el rol del usuario
    if (req.user.role !== 'admin') {
        return res.redirect('/news');
    }

    next();
};