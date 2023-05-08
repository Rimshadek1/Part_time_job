var express = require('express');
var router = express.Router();
var userHelper = require('../helpers/userHelpers')
// const otpGenerator = require('otp-generator');
// const userHelpers = require('../helpers/userHelpers');
// const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });

const session = require('express-session');
const { response } = require('../app');
const adminHelpers = require('../helpers/adminHelpers');
router.use(session({
  secret: 'Key',
  resave: false,
  saveUninitialized: false, cookie: { maxAge: 6000000 }
}));
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/index')
  }
}
router.get('/index', (req, res) => {
  res.render('index')
})
/* GET home page. */
router.get('/', verifyLogin, async function (req, res, next) {
  try {
    console.log('in root route');
    let user = req.session.user;
    console.log(user.mobile);

    if (!user) {
      // Redirect the user to the login page if they are not logged in
      res.redirect('/index');
      return;
    }
    if (req.session.user) {
      cartCount = await userHelper.getCartCount(req.session.user._id)
    }
    let events = await adminHelpers.getAllEvents()
    let income = await adminHelpers.getIncome1(user.mobile)
    console.log(income);
    let total = await adminHelpers.totalIncome(user)
    res.render('index1', { user, events, income, total, cartCount });
  } catch (error) {
    console.error(error);
    next(error);
  }
});


router.get('/login', function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('app-login', { 'loginErr': req.session.LogginErr });
    req.session.LogginErr = false
  }

});
router.post('/login', async (req, res) => {
  try {
    const response = await userHelper.doLogin(req.body).then((response) => {
      if (response.status) {
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.redirect('/');
      } else {
        req.session.LogginErr = 'Invalid Username or Password';
        res.redirect('/app-login');
      }


    });
  } catch (error) {
    console.log(error);
  }
});
router.get('/app-login', function (req, res, next) {
  res.render('app-login', { title: 'Express' });
});
router.get('/app-register', function (req, res, next) {
  res.render('app-register', { title: 'Express' });
});

router.post('/submit', function (req, res) {

  console.log(req.body);
  userHelper
    .doSignup(req.body, req.body.otp)
    .then(async (id) => {
      let image = req.files.image;
      let imageName = id + '.jpg';

      if (image.mimetype === 'image/png') {
        // check if image is PNG
        imageName = id + '.png';
      }

      console.log(id);
      await image.mv('./public/Profile-pictures/' + imageName); // use await to make sure the file is saved before rendering the page

      res.render('app-login');
    })
    .catch((error) => {
      console.log(error);
      res.render('app-register', { error: error });
    });

});





// Handle OTP request
router.post('/send-otp', async (req, res) => {
  const mobileNumber = req.body.mobile;
  try {
    const otp = await userHelper.generateOtp(mobileNumber);
    res.send(`OTP sent successfully to ${mobileNumber}`);
  } catch (error) {
    console.error('There was an error sending the OTP:', error);
    res.status(500).send('Failed to send OTP');
  }
});


router.get('/app-settings', async (req, res) => {
  let user = req.session.user;
  if (!user) {
    // Redirect the user to the login page if they are not logged in
    res.redirect('/login');
    return;
  }
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  res.render('app-settings', { user, cartCount });
});

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('app-login')
})
router.get('/app-cards', async (req, res) => {
  let events = await adminHelpers.getAllEvents()
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  res.render('app-cards', { events, cartCount })
})
router.get("/app-booking", verifyLogin, async (req, res) => {
  let events = await userHelper.getCartProducts(req.session.user._id)
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  console.log(events);
  res.render('Booking', {
    events, user: req.session.user, cartCount
  })

})
router.get('/confirm-book/:id', verifyLogin, (req, res) => {
  console.log(req.params.id);
  console.log(req.session.user._id);
  userHelper.Booking(req.params.id, req.session.user._id).then((response) => {
    console.log(response);
    res.redirect('/')

  });
})
router.post('/delete-cart-item', (req, res) => {
  console.log(req.body);
  userHelper.deleteCart(req.body).then((response) => {
    res.json(response)
  })
})
router.post('/confirmBook', async (req, res) => {
  let events = await userHelper.getCartProducts(req.session.user._id)
  userHelper.confirmBooking(req.session.user, events).then((response) => {
    res.redirect('/')
  })
})
router.get('/app-transactions', verifyLogin, async (req, res) => {
  let user = req.session.user
  let income = await adminHelpers.getIncome(user.mobile)
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  res.render('app-transactions', { income, cartCount })
})
router.post('/withDraw',verifyLogin, (req, res) => {
  user = req.session.user
  console.log(user);
  console.log(req.body);
  userHelper.withDrawRequest(req.body,user).then((response) => {
    res.json(response)
  })
})

module.exports = router;
