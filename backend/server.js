/**
 * © 2024 Jerry Tan. All Rights Reserved.
 *
 * This software is the confidential and proprietary information of Jerry Tan
 * ("Confidential Information"). You shall not disclose such Confidential Information
 * and shall use it only in accordance with the terms under which this software
 * was distributed or otherwise published, and solely for the prior express purposes
 * explicitly communicated and agreed upon, and only for those specific permissible purposes.
 *
 * This software is provided "AS IS," without a warranty of any kind. All express or implied
 * conditions, representations, and warranties, including any implied warranty of merchantability,
 * fitness for a particular purpose, or non-infringement, are disclaimed, except to the extent
 * that such disclaimers are held to be legally invalid.
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/taskapp', { useNewUrlParser: true, useUnifiedTopology: true });

// Task schema and model
const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  labels: [String],
  comments: [{ user: String, text: String }]
});
const Task = mongoose.model('Task', TaskSchema);

// Middleware for parsing JSON requests
app.use(express.json());

// JWT authentication middleware
app.use((req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send('Access denied. No token provided.');

  try {
    const decoded = jwt.verify(token, 'jwtPrivateKey');
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send('Invalid token.');
  }
});

// API routes for tasks
app.post('/tasks', async (req, res) => {
  const { title, description, labels } = req.body;
  const task = new Task({ title, description, labels });
  await task.save();
  io.emit('taskCreated', task);  // Emit task creation event
  res.status(201).send(task);
});

app.get('/tasks', async (req, res) => {
  const tasks = await Task.find();
  res.send(tasks);
});

// Socket.io events for real-time updates
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(5000, () => {
  console.log('Server listening on port 5000');
});
