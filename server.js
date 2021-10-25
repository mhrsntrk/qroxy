const app = require('./index')
require('dotenv').config();

var port = process.env.PORT || 5050;

app.listen(port, (err) => {
    if (err) throw err
    console.log("RESTful API server started on:" + port)
})
