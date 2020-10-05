const mongoose = require('mongoose');
const mongoDB = `mongodb://${process.env.MONGODB_URI}/${process.env.DB_ID}`;

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('debug', true);

module.exports = mongoose;