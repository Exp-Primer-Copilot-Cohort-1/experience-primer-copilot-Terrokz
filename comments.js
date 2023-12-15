// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');

// Create express app
const app = express();
// Use body parser middleware
app.use(bodyParser.json());
// Use CORS middleware
app.use(cors());

// Create comments object
const commentsByPostId = {};

// Create route for getting comments
app.get('/posts/:id/comments', (req, res) => {
  // Get comments for the post id
  const comments = commentsByPostId[req.params.id] || [];
  // Send comments
  res.send(comments);
});

// Create route for creating comments
app.post('/posts/:id/comments', async (req, res) => {
  // Create comment id
  const commentId = randomBytes(4).toString('hex');
  // Get comment content from request body
  const { content } = req.body;
  // Get comments for post id
  const comments = commentsByPostId[req.params.id] || [];
  // Add comment to comments
  comments.push({ id: commentId, content, status: 'pending' });
  // Set comments for post id
  commentsByPostId[req.params.id] = comments;
  // Emit event
  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: { id: commentId, content, postId: req.params.id, status: 'pending' },
  });
  // Send comments
  res.status(201).send(comments);
});

// Create route for receiving events
app.post('/events', async (req, res) => {
  // Get event type and data from request body
  const { type, data } = req.body;
  // Log event type
console.log(`Received event: ${type}`);
// Check if event type is CommentModerated
if (type === 'CommentModerated') {
    // Get comments for post id
    const comments = commentsByPostId[data.postId];
    // Find comment with id
    const comment = comments.find((comment) => comment.id === data.id);
    // Update comment status
    comment.status = data.status;
    // Emit event
    await axios.post('http://event-bus-srv:4005/events', {
            type: 'CommentUpdated',
            data,
    });
}
});
