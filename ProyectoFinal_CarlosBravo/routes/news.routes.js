const express = require('express');
const router = express.Router();
const News = require('../models/news.model'); // Modelo de noticias
const { protect, adminOnly } = require('../middleware/auth'); // Middleware de protección
const upload = require('../middleware/upload');

//Mostrar lista de noticias para clientes
router.get('/', protect, async (req, res) => {
    try {
        const news = await News.aggregate([{ $sample: { size: 10 } }]); // Obtener 10 noticias aleatorias
        res.render('news/client-dashboard', { news, user: req.user });
    } catch (err) {
        console.error('Error al cargar las noticias:', err);
        res.status(500).render('news/client-dashboard', {
            error: 'Error al cargar las noticias.',
            news: [],
            user: req.user,
        });
    }
});

const fs = require('fs');
const path = require('path');

// Mostrar formulario para crear noticia
router.get('/create', protect, adminOnly, (req, res) => {
    const imagesDir = path.join(__dirname, '../public/img/');
    let images = [];

    try {
        // Leer la carpeta de imágenes
        images = fs.readdirSync(imagesDir).filter(file => {
            // Filtrar solo archivos de imágenes válidos (por ejemplo, .jpg, .png)
            return /\.(jpg|jpeg|png|gif)$/i.test(file);
        });
    } catch (err) {
        console.error('Error al leer la carpeta de imágenes:', err);
    }

    res.render('news/create', { user: req.user, images, error: null, success: null });
});

// Crear una nueva noticia
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
    try {
        const { title, content, category, keywords, author } = req.body;

        // Validar que se haya seleccionado una imagen
        if (!req.file) {
            return res.render('news/create', {
                user: req.user,
                error: 'Debes seleccionar una imagen.',
                success: null,
            });
        }

        // Ruta de la imagen subida
        const imagePath = `/img/${req.file.filename}`;

        // Crear la noticia
        await News.create({
            title,
            content,
            category,
            keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
            author,
            image: imagePath, // Guardar la ruta de la imagen en la base de datos
        });

        res.render('news/create', {
            user: req.user,
            error: null,
            success: 'Noticia creada exitosamente.',
        });
    } catch (err) {
        console.error('Error al crear noticia:', err);
        res.render('news/create', {
            user: req.user,
            error: 'Error al crear la noticia.',
            success: null,
        });
    }
});

// Mostrar formulario para editar una noticia
router.get('/edit/:id', protect, adminOnly, async (req, res) => {
    const imagesDir = path.join(__dirname, '../public/img/');
    let images = [];

    try {
        // Leer la carpeta de imágenes
        images = fs.readdirSync(imagesDir).filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
    } catch (err) {
        console.error('Error al leer la carpeta de imágenes:', err);
    }

    try {
        const news = await News.findById(req.params.id);

        if (!news) {
            return res.status(404).render('news/admin-dashboard', {
                error: 'Noticia no encontrada.',
                success: null,
                news: [],
                user: req.user,
                images,
            });
        }

        res.render('news/edit', {
            news,
            user: req.user,
            error: null,
            success: null,
            images, // Pasar imágenes al contexto
        });
    } catch (err) {
        console.error('Error al cargar la noticia para edición:', err);
        res.status(500).render('news/admin-dashboard', {
            error: 'Error al cargar la noticia.',
            success: null,
            news: [],
            user: req.user,
            images,
        });
    }
});

// Editar noticia con subida de imagen
router.post('/edit/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
    try {
        const { title, content, category, keywords, author } = req.body;

        // Validar campos obligatorios
        if (!title || !content || !category || !author) {
            const news = await News.findById(req.params.id);
            return res.render('news/edit', {
                news,
                error: 'Todos los campos son obligatorios.',
                success: null,
                user: req.user,
            });
        }

        // Ruta de la imagen subida
        let imagePath;
        if (req.file) {
            imagePath = `/img/${req.file.filename}`;
        }

        // Actualizar la noticia
        const updatedNews = await News.findByIdAndUpdate(
            req.params.id,
            {
                title,
                content,
                category,
                keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
                author,
                ...(imagePath && { image: imagePath }), // Actualizar imagen si se seleccionó
            },
            { new: true } // Devolver la noticia actualizada
        );

        res.render('news/edit', {
            news: updatedNews,
            error: null,
            success: 'Noticia actualizada exitosamente.',
            user: req.user,
        });
    } catch (err) {
        console.error('Error al actualizar noticia:', err);
        res.render('news/edit', {
            news: await News.findById(req.params.id),
            error: 'Error al actualizar la noticia.',
            success: null,
            user: req.user,
        });
    }
});


//Eliminar una noticia
router.post('/delete/:id', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedNews = await News.findByIdAndDelete(id);

        if (!deletedNews) {
            return res.status(404).json({ error: 'Noticia no encontrada.' });
        }

        res.status(200).json({ message: 'Noticia eliminada exitosamente.' });
    } catch (err) {
        console.error('Error al eliminar noticia:', err);
        res.status(500).json({ error: 'Error al eliminar la noticia.' });
    }
});

// Ver detalle de una noticia para cliente
router.get('/:id', protect, async (req, res) => {
    try {
        const news = await News.findById(req.params.id);

        if (!news) {
            return res.status(404).render('news/detail', {
                news: null,
                error: 'Noticia no encontrada.',
                user: req.user,
            });
        }

        // Dividir el contenido en párrafos según un delimitador (ejemplo: '. ')
        const paragraphs = news.content.split('. ').map((para) => para.trim() + '.');

        // Obtener noticias relacionadas (10 aleatorias, excepto la actual)
        const relatedNews = await News.aggregate([
            { $match: { _id: { $ne: news._id } } },
            { $sample: { size: 10 } },
        ]);

        res.render('news/detail', { news, paragraphs, relatedNews, error: null, user: req.user });
    } catch (err) {
        console.error('Error al cargar detalle de la noticia:', err);
        res.status(500).render('news/detail', {
            news: null,
            error: 'Error al cargar la noticia.',
            user: req.user,
        });
    }
});



module.exports = router;
