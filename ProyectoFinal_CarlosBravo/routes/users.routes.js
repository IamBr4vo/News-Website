const express = require('express');
const User = require('../models/user.model');
const { protect, adminOnly } = require('../middleware/auth');
const News = require('../models/news.model');
const router = express.Router();

// Panel del administrador
router.get('/admin-dashboard', protect, adminOnly, async (req, res) => {
    try {
        const users = await User.find(); // Consulta usuarios
        const news = await News.find().populate('author', 'name'); // Consulta noticias
        if (!users || !news) throw new Error('No se encontraron datos');
        res.render('users/admin-dashboard', { users, news, user: req.user }); // Pasa los datos a la vista
    } catch (err) {
        console.error(err.message); // Log para depuración
        res.status(500).send('Error al cargar el panel de administración.');
    }
});

// Renderizar formulario de registro
router.get('/register', (req, res) => {
    res.render('users/register', {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        error: null,
        success: null,
        user: null
    });
});

// Manejar registro de usuario
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // Validar que el nombre no contenga números
        if (/\d/.test(name)) {
            return res.render('users/register', {
                error: 'El nombre no puede contener números.',
                success: null,
                name,
                email,
                password,
                confirmPassword,
                user: null
            });
        }

        // Validar longitud mínima de la contraseña
        if (password.length < 6) {
            return res.render('users/register', {
                error: 'La contraseña debe tener al menos 6 caracteres.',
                success: null,
                name,
                email,
                password,
                confirmPassword,
                user: null
            });
        }

        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            return res.render('users/register', {
                error: 'Las contraseñas no coinciden.',
                success: null,
                name,
                email,
                password,
                confirmPassword,
                user: null
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.render('users/register', {
                error: 'El correo electrónico ya está en uso.',
                success: null,
                name,
                email,
                password,
                confirmPassword,
                user: null
            });
        }

        await User.create({ name, email, password, role: 'cliente' });

        // Mostrar mensaje de éxito y limpiar los campos
        return res.render('users/register', {
            error: null,
            success: 'Usuario registrado exitosamente. Ahora puedes iniciar sesión.',
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            user: null
        });
    } catch (err) {
        console.error('Error al registrar usuario:', err);
        return res.render('users/register', {
            error: 'Error al registrar el usuario. Inténtalo nuevamente.',
            success: null,
            name,
            email,
            password,
            confirmPassword,
            user: null
        });
    }
});

// Formulario de registro para administradores
router.get('/admin-register', protect, adminOnly, (req, res) => {
    res.render('users/admin-register', {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        error: null,
        success: null,
        user: req.user,
    });
});

// Registrar usuario (solo administradores)
router.post('/admin-register', protect, adminOnly, async (req, res) => {
    try {
        const { name, email, password, confirmPassword, role } = req.body;

        // Validar que el nombre no contenga números
        if (/\d/.test(name)) {
            return res.render('users/admin-register', {
                error: 'El nombre no puede contener números.',
                success: null,
                name,
                email,
                password,
                confirmPassword,
                user: req.user,
            });
        }

        if (password.length < 6) {
            return res.render('users/admin-register', {
                error: 'La contraseña debe tener al menos 6 caracteres.',
                success: null,
                name,
                email,
                password,
                confirmPassword,
                user: req.user,
            });
        }

        if (password !== confirmPassword) {
            return res.render('users/admin-register', {
                error: 'Las contraseñas no coinciden.',
                success: null,
                name,
                email,
                password,
                confirmPassword,
                user: req.user,
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.render('users/admin-register', {
                error: 'El correo electrónico ya está en uso.',
                success: null,
                name,
                email,
                password,
                confirmPassword,
                user: req.user,
            });
        }

        await User.create({ name, email, password, role });
        return res.render('users/admin-register', {
            error: null,
            success: 'Usuario registrado exitosamente.',
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            user: req.user,
        });
    } catch (err) {
        console.error('Error al registrar usuario:', err);
        return res.render('users/admin-register', {
            error: 'Error al registrar el usuario. Inténtalo nuevamente.',
            success: null,
            name,
            email,
            password,
            confirmPassword,
            user: req.user,
        });
    }
});

router.get('/edit/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).render('users/admin-dashboard', {
                error: 'Usuario no encontrado.',
                success: null,
                users: await User.find(),
                user: req.user,
            });
        }

        res.render('users/edit-user', { error: null, success: null, userToEdit: user, user: req.user });
    } catch (err) {
        console.error('Error al cargar usuario para edición:', err);
        res.status(500).render('users/admin-dashboard', {
            error: 'Error al cargar el usuario para edición.',
            success: null,
            users: await User.find(),
            user: req.user,
        });
    }
});


router.post('/edit/:id', protect, adminOnly, async (req, res) => {
    try {
        const { name, email, role, password } = req.body;
        const userIdToEdit = req.params.id;

        // Validar campos obligatorios
        if (!name || !email) {
            return res.render('users/edit-user', {
                error: 'Nombre y correo electrónico son obligatorios.',
                success: null,
                userToEdit: await User.findById(userIdToEdit),
                user: req.user,
            });
        }

        const userToEdit = await User.findById(userIdToEdit);

        if (!userToEdit) {
            return res.render('users/edit-user', {
                error: 'Usuario no encontrado.',
                success: null,
                userToEdit: null,
                user: req.user,
            });
        }

        // Validar restricciones
        const adminPrincipalEmail = 'bravo123@gmail.com';

        if (req.user.email === adminPrincipalEmail && userToEdit.email === adminPrincipalEmail && role !== userToEdit.role) {
            return res.render('users/edit-user', {
                error: 'No puedes editar tu propio rol.',
                success: null,
                userToEdit,
                user: req.user,
            });
        }

        if (req.user.id === userToEdit.id && role !== userToEdit.role) {
            return res.render('users/edit-user', {
                error: 'No puedes cambiar tu propio rol.',
                success: null,
                userToEdit,
                user: req.user,
            });
        }

        // Actualizar información del usuario
        userToEdit.name = name;
        userToEdit.email = email;

        // Actualizar la contraseña solo si se proporciona
        if (password) {
            if (password.length < 6) {
                return res.render('users/edit-user', {
                    error: 'La contraseña debe tener al menos 6 caracteres.',
                    success: null,
                    userToEdit,
                    user: req.user,
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10); // Encripta la nueva contraseña
            userToEdit.password = hashedPassword;
        }

        // Actualizar el rol solo si está permitido
        if (req.user.email !== adminPrincipalEmail || userToEdit.email !== adminPrincipalEmail) {
            userToEdit.role = role;
        }

        await userToEdit.save();

        res.render('users/edit-user', {
            error: null,
            success: 'Usuario actualizado exitosamente.',
            userToEdit,
            user: req.user,
        });
    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        res.status(500).render('users/edit-user', {
            error: 'Error al actualizar el usuario.',
            success: null,
            userToEdit: await User.findById(req.params.id),
            user: req.user,
        });
    }
});

// Ruta para eliminar usuario
router.post('/delete/:id', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;

        // No permitir eliminar al usuario actualmente logueado
        if (id === req.user.id) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
        }

        // No permitir eliminar al administrador principal
        const adminUser = await User.findOne({ email: 'bravo123@gmail.com' });
        if (id === adminUser.id) {
            return res.status(400).json({ error: 'No puedes eliminar al administrador principal.' });
        }

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.status(200).json({ message: 'Usuario eliminado exitosamente.' });
    } catch (err) {
        console.error('Error al eliminar usuario:', err);
        res.status(500).json({ error: 'Error al eliminar el usuario.' });
    }
});

module.exports = router;
