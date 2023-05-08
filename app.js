var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// const generateOTP = require('generate-otp');
const bodyParser = require('body-parser');
// const otp = generateOTP.generate({ digits: 4, alphabets: false, upperCase: false, specialChars: false });
var fileUpload = require('express-fileupload');
var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
var db = require('./config/connection');
const handlebars = require('handlebars');



// var session = require('express-session')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use(bodyParser.json());
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});


// app.use(session({
//   secret: 'Key',
//   resave: false,
//   saveUninitialized: false, cookie: { maxAge: 600000 }
// }))
db.connect((err) => {
  if (err)
    console.log('errrorrrr' + err);
  else
    console.log("Database connected");
})
// app.use('/', require('./routes/index'));
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
