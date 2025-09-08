function handleError(res, error, message = "Server error", status = 500) {
  console.error(message, error);
  return res.status(status).json({ message, error: error?.message });
}

module.exports = { handleError };

// app.get('/search', (req, res) => {
//   const term = req.query.term;
//   const sort = req.query.sort;
  
//   res.send(`Search term: ${term}, Sort by: ${sort}`);
// });