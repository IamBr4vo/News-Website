const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/img')); // Carpeta de destino
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName); // Nombre único para evitar colisiones
    },
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    if (/\.jpg|\.jpeg|\.png|\.gif$/i.test(file.originalname)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen.'), false);
    }
};

// Middleware de multer
const upload = multer({ storage, fileFilter });

module.exports = upload;
