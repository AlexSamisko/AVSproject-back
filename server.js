var express = require('express');
var app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');
const { SQLHandler } = require('./SQLHandler/SQLHandler.js');
const WebSocket = require('ws');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const geoip = require('geoip-lite');

dotenv.config();

// server options

const sqlHandler = new SQLHandler();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateCode = () => Math.floor(100000 + Math.random() * 900000);

const corsOptions = {
  origin: '*',
  exposeHeaders: ['application/json'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  allowHeaders: ['Content-Type'],
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(
  bodyParser.urlencoded({ extended: true }),
  bodyParser.json(),
  bodyParser.text()
);

// end of server options

// token and crypt options

const generateToken = (userId) => {
  return jwt.sign({ userId }, 'secret_key', { expiresIn: '1h' }); // for 1 hour token...
};

const doHashPassword = async (password, saltRounds) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        reject(err);
        throw new Error(err);
      }
      sqlHandler.user.hash = hash;
      resolve();
    });
  });
};

const doDecodedId = async (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, 'secret_key', (err, decoded) => {
      if (err) {
        reject(err);
        return res.status(401).json({ message: 'Invalid or expired token' });
      } else {
        sqlHandler.user.id = decoded.userId;
        resolve();
      }
    });
  });
};

// end of token and crypt options

// server http handlers

// user auth handlers

app.post('/token', async (req, res) => {
  const { password } = req.body;

  await sqlHandler.findUserByLogin(req.body);

  bcrypt.compare(password, sqlHandler.user.password, async (err, isMatch) => {
    if (err) return res.status(500).json({ err });
    if (!isMatch)
      return res.status(401).json({ error: 'Invalid login/password' });

    const token = generateToken(sqlHandler.user.id);
    await sqlHandler.saveNewToken(sqlHandler.user.id, token);

    res.json({ token });

    sqlHandler.user = {};
  });
});

app.post('/restoreandlogin', async (req, res) => {
  const { login, code, password } = req.body;
  // найти логин в очереди на восстановление и сравнить проверочный код

  const restorationInProgress = sqlHandler.verificationToRestore.findIndex(
    (item) => item.login === login
  );
  if (sqlHandler.verificationToRestore[restorationInProgress].code !== code) {
    return res.json({ error: 'Invalid verification code' });
  } else {
    if (restorationInProgress !== -1) {
      sqlHandler.verificationToRestore.splice(restorationInProgress, 1);
    }
    console.log(sqlHandler.verificationToRestore);

    // изменить пароль в базе данных

    const hashedPassword = await bcrypt.hash(password, 10);
    await sqlHandler.replacePassword({ login, password: hashedPassword });

    // выдать токен и отправить назад

    await sqlHandler.findUserByLogin(req.body);

    bcrypt.compare(password, sqlHandler.user.password, async (err, isMatch) => {
      if (err) return res.status(500).json({ err });
      if (!isMatch) {
        console.log(
          'Passwords do not match:',
          password,
          sqlHandler.user.password
        );
        return res.status(401).json({ error: 'Invalid login/password' });
      }

      const token = generateToken(sqlHandler.user.id);
      await sqlHandler.saveNewToken(sqlHandler.user.id, token);

      res.json({ token });

      sqlHandler.user = {};
    });
  }
});

app.get('/get-location', async (req, res) => {
  try {
    const userIP = (req.headers['x-forwarded-for'] || req.socket.remoteAddress)
      .split(',')[0]
      .trim();
    const geo = geoip.lookup(userIP);
    res.json(geo.ll);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get('/login', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token required' });

  try {
    await doDecodedId(token);
    await sqlHandler.sendLoginStatusBack(sqlHandler.user.id);
    res.json(sqlHandler.user);
    sqlHandler.user = {};
    sqlHandler.userExists = false;
  } catch (error) {
    console.error('Error on login:', error);
    res.json({
      error: error.message,
    });
  }
});

app.post('/presignup', async (req, res) => {
  try {
    await sqlHandler.sendPreSignInStatusBack(req.body);
    const { login } = req.body;
    console.log(req.body);

    const code = generateCode().toString();

    sqlHandler.verification = [
      ...sqlHandler.verification,
      {
        login: login,
        code: code,
      },
    ];

    if (!login) {
      throw new Error('Please enter your mail');
    }

    console.log(sqlHandler.verification);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: login,
      subject: 'Your verification code',
      text: `Your verification code is: ${code}`,
    };

    await transporter.sendMail(mailOptions);
    console.log('code was sent');
    res.json({ message: 'Code sent successfully!' });
  } catch (error) {
    console.error('Error on pre-SignUp:', error);
    res.json({
      error: error.message,
    });
  }
});

app.post('/clearpresignup', async (req, res) => {
  try {
    const { login } = req.body;

    const verificationInProgress = sqlHandler.verification.findIndex(
      (item) => item.login === login
    );
    if (verificationInProgress !== -1) {
      console.log(verificationInProgress);
      sqlHandler.verification.splice(verificationInProgress, 1);
      console.log(sqlHandler.verification);
    }
    console.log('SignUp aborted!');
    res.json({ message: 'SignUp aborted!' });
  } catch (error) {
    console.error('Error on pre-SignUp:', error);
    res.json({
      error: error.message,
    });
  }
});

app.post('/signup', async (req, res) => {
  try {
    const { password, user_id, login, code } = req.body;
    console.log(req.body);

    const verificationInProgress = sqlHandler.verification.findIndex(
      (item) => item.login === login
    );

    if (sqlHandler.verification[verificationInProgress].code === code) {
      if (verificationInProgress !== -1) {
        sqlHandler.verification.splice(verificationInProgress, 1);
      }

      const token = generateToken(user_id);

      const saltRounds = 10;
      await doHashPassword(password, saltRounds);
      await sqlHandler.sendSignInStatusBack(
        req.body,
        sqlHandler.user.hash,
        token
      );
      res.json(sqlHandler.user);
      sqlHandler.loginAlreadyExists = false;
      sqlHandler.user = {};
    } else {
      throw new Error('Verification code is wrong');
    }
  } catch (error) {
    console.error('Error on SignUp:', error);
    res.json({
      error: error.message,
    });
  }
});

app.post('/verifytorestore', async (req, res) => {
  try {
    await sqlHandler.findLogin(req.body);
    const { login } = req.body;
    console.log(req.body);

    if (!sqlHandler.loginAlreadyExists) {
      throw new Error('Please enter correct mail');
    }

    const code = generateCode().toString();

    sqlHandler.verificationToRestore = [
      ...sqlHandler.verificationToRestore,
      {
        login: login,
        code: code,
      },
    ];

    if (!login) {
      throw new Error('Please enter your mail');
    }

    console.log(sqlHandler.verificationToRestore);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: login,
      subject: 'Your verification code to restore your password',
      text: `Your verification code to restore your password is: ${code}`,
    };

    await transporter.sendMail(mailOptions);
    console.log('code was sent');
    sqlHandler.loginAlreadyExists = true;
    res.json({ message: 'Code sent successfully!' });
  } catch (error) {
    console.error('Error on pre-SignUp:', error);
    res.json({
      error: error.message,
    });
  }
});

//todo handlers

app.get('/todos/:userId', async function (req, res) {
  const userId = req.params.userId;
  try {
    await sqlHandler.giveTodos(userId);
    res.json(sqlHandler.responce[userId] ? sqlHandler.responce[userId] : []);
    sqlHandler.clearResponce(userId);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).send('Error fetching todos');
  }
});

app.post('/post/todo', async (req, res) => {
  const { user_id } = req.body;
  sqlHandler.addTodo(req.body);
  try {
    await sqlHandler.giveTodos(user_id);
    res.json(sqlHandler.responce[user_id] ? sqlHandler.responce[user_id] : []);
    sqlHandler.clearResponce(user_id);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).send('Error fetching todos');
  } finally {
  }
});

app.post('/post/delete/all', async (req, res) => {
  const { user_id } = req.body;
  sqlHandler.deleteAllTodos(user_id);

  try {
    await sqlHandler.giveTodos(user_id);
    res.json(sqlHandler.responce[user_id] ? sqlHandler.responce[user_id] : []);
    sqlHandler.clearResponce(user_id);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).send('Error fetching todos');
  }
});

app.post('/post/delete/completed', async (req, res) => {
  const { user_id } = req.body;
  sqlHandler.deleteCompletedTodos(user_id);

  try {
    await sqlHandler.giveTodos(user_id);
    res.json(sqlHandler.responce[user_id] ? sqlHandler.responce[user_id] : []);
    sqlHandler.clearResponce(user_id);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).send('Error fetching todos');
  }
});

app.patch('/patch/deletetodo', async function (req, res) {
  const { user_id, todo_id } = req.body;
  sqlHandler.deleteTodo(todo_id);

  try {
    await sqlHandler.giveTodos(user_id);
    res.json(sqlHandler.responce[user_id] ? sqlHandler.responce[user_id] : []);
    sqlHandler.clearResponce(user_id);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).send('Error fetching todos');
  }
});

app.patch('/patch/completetodo', async function (req, res) {
  const { user_id } = req.body;
  sqlHandler.completeTodo(req.body);
  try {
    await sqlHandler.giveTodos(user_id);
    res.json(sqlHandler.responce[user_id] ? sqlHandler.responce[user_id] : []);
    sqlHandler.clearResponce(user_id);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).send('Error fetching todos');
  }
});

// end of server http handlers

// http server

const PORT = process.env.PORT || 5000;

var server = app.listen(PORT, function () {
  console.log('Node server is running..');
});

// ws server

const wss = new WebSocket.Server({ server });

// ws server hadler

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('New client connected');

  ws.on('message', (message) => {
    const sendCommentsToClient = async () => {
      try {
        await sqlHandler.giveComments();
        let jsonData = JSON.stringify({
          type: 'comments',
          comments: sqlHandler.responce['comments']
            ? sqlHandler.responce['comments']
            : [],
        });
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(jsonData);
          }
        });
        sqlHandler.clearResponce('comments');
      } catch (error) {
        console.error('Error fetching comments:', error);
        const reply = {
          type: 'error',
          text: error.message,
        };
        ws.send(JSON.stringify(reply));
      }
    };

    if (JSON.parse(message).action === 'show comments') {
      sendCommentsToClient();
    }

    if (JSON.parse(message).action === 'add comment') {
      sqlHandler.addComment(JSON.parse(message));
      sendCommentsToClient();
    }

    if (JSON.parse(message).action === 'delete comment') {
      sqlHandler.deleteComment(JSON.parse(message));
      sendCommentsToClient();
    }

    if (JSON.parse(message).action === 'redact comment') {
      sqlHandler.redactComment(JSON.parse(message));
      sendCommentsToClient();
    }

    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
  });
});
