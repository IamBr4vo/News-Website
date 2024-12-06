const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
require('dotenv').config(); // Variables de entorno
const mongoose = require('./conexion'); // Conexión a la base de datos
const userRoutes = require('./routes/users.routes'); // Rutas de usuarios
const newsRoutes = require('./routes/news.routes'); // Rutas de noticias
const loginRoutes = require('./routes/login.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Configuración del motor de plantillas
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Ruta principal
app.get('/', (req, res) => {
    res.render('users/login', { user: res.locals.user || null, error: null, email: null });
});

// Rutas
app.use('/users', userRoutes);
app.use('/news', newsRoutes);
app.use('/login', loginRoutes);

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

