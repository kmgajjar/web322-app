const express = require('express');
const app = express();
const port = 3000;

// Define routes
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/about.html');
});

app.get('/categories', (req, res) => {

});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
