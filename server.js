const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const http = require('http');
const socketio = require('socket.io');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

mongoose.connect('mongodb+srv://admin:macmor123@cluster0.8kazm4s.mongodb.net/chatAppDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ secret: 'chatappsecret', resave: false, saveUninitialized: false }));
app.set('view engine', 'ejs');

// Chat status
let chatEnabled = true;

app.get('/', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  if (req.session.isAdmin) return res.redirect('/admin');
  res.redirect('/chat');
});

app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
  const { name, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const isAdmin = name.toLowerCase() === "admin";
  const user = new User({ name, password: hashed, isAdmin });
  await user.save();
  res.redirect('/login');
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
  const { name, password } = req.body;
  const user = await User.findOne({ name });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.send('Credenciales incorrectas');
  }
  req.session.userId = user._id;
  req.session.isAdmin = user.isAdmin;
  res.redirect('/');
});

app.get('/chat', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const user = await User.findById(req.session.userId);
  res.render('chat', { user });
});

app.get('/admin', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/chat');
  const user = await User.findById(req.session.userId);
  res.render('admin', { user });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

io.on('connection', socket => {
  socket.emit('chatStatus', chatEnabled);

  socket.on('message', msg => {
    if (chatEnabled) io.emit('message', msg);
  });

  socket.on('toggleChat', () => {
    chatEnabled = !chatEnabled;
    io.emit('chatStatus', chatEnabled);
  });

  socket.on('getChatStatus', () => {
    socket.emit('chatStatus', chatEnabled);
  });
});

const port = process.env.PORT || 3000;

server.listen(port, '0.0.0.0', () => {
  console.log(`Servidor disponible en red local en el puerto ${port}`);
});
