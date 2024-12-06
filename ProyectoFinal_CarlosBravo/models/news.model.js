const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'El título es obligatorio'],
            trim: true,
        },
        content: {
            type: String,
            required: [true, 'El contenido es obligatorio'],
        },
        category: {
            type: String,
            required: [true, 'La categoría es obligatoria'],
            trim: true,
        },
        keywords: [
            {
                type: String,
                trim: true,
            },
        ],
        author: {
            type: String, // Autor en texto
            required: [true, 'El autor es obligatorio'],
            trim: true,
        },
        image: {
            type: String, // Ruta de la imagen (opcional)
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('News', newsSchema);
