const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios'); 
const dotenv = require('dotenv');

const SECRET_KEY = 'secret';
const router = express.Router();
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/', router);

dotenv.config();

const authenticate = (req, res, next) => {
  const token = req.header('Authorization') || req.query.token;

  if (!token) {
    return res.json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.json({ message: 'Invalid token.' });
  }
};

const checkWeeklistStatus = (req, res, next) => {
  const { id } = req.params;
  const weeklist = req.user.weekLists.find((wl) => wl._id.toString() === id);

  if (!weeklist) {
    return res.status(404).json({ message: 'Weeklist not found' });
  }

  if (weeklist.status === 'completed' || weeklist.status === 'inactive') {
    return res.status(403).json({ message: 'Weeklist cannot be modified' });
  }

  req.weeklist = weeklist;
  next();
};



app.get('/weeklist/:id', authenticate, checkWeeklistStatus, (req, res) => {
  res.json(req.weeklist);
});

app.get('/feed', authenticate, (req, res) => {
  const activeWeeklists = req.user.weekLists.filter((wl) => wl.status === 'active');
  res.json(activeWeeklists);
});

app.put('/weeklist/:id/mark', authenticate, checkWeeklistStatus, (req, res) => {
  const { weeklist } = req;
  weeklist.completed = !weeklist.completed;
  weeklist.status = weeklist.completed ? 'completed' : 'active';
  res.json(weeklist);
});



mongoose
  .connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(`Server running successfully on http://localhost:${process.env.PORT}`))
  .catch((error) => console.log(error));

app.listen(process.env.PORT);