var express = require('express');
var router = express.Router();
var adminHelper = require('../helpers/adminHelpers');
const userHelpers = require('../helpers/userHelpers');
const { ObjectId } = require('mongodb');
const { response } = require('../app');

/* GET users listing. */
router.get('/', function (req, res, next) {
  adminHelper.getAllEvents().then((events) => {
    console.log(events);
    res.render('admin/view-event', { admin: true, events })
  })
});
router.get('/add-event', (req, res) => {
  res.render('admin/add-event');
})
router.post('/add-events', (req, res) => {
  adminHelper.addEvent(req.body).then((response) => {
    if (response) {
      adminHelper.getAllEvents().then((events) => {
        console.log(events);
        res.render('admin/view-event', { admin: true, events })
      })
    }
    else {
      console.log('error in adding products');
    }
  })
})
router.get('/delete-event/:id', (req, res) => {
  let proId = req.params.id;
  console.log(proId);
  adminHelper.deleteEvent(proId)
    .then((response) => {
      res.redirect('/admin/');
    })
});

router.get('/edit-event/:id', async (req, res) => {
  try {
    const isValidObjectId = ObjectId.isValid(req.params.id);
    if (!isValidObjectId) {
      throw new Error('Invalid id');
    }
    let event = await adminHelper.getEventDetails(req.params.id)
    console.log(event);
    res.render('admin/edit-event', { event });
  } catch (error) {
    console.error(error);
    res.status(400).send('Bad request');
  }
})

router.post('/edit-eventss/:id', (req, res) => {
  adminHelper.updateEvent(req.params.id, req.body).then(() => {
    res.redirect('/admin')
  })
})
router.get('/add-salary', (req, res) => {
  res.render('admin/add-salary')
})
router.post('/addSalary', (req, res) => {
  adminHelper.addSalary(req.body).then((response) => {
    if (response) {
      adminHelper.viewSalary().then((salary) => {
        res.render('admin/view-salary'
          , { salary })
      })
    }
  })
})
router.get('/view-salary', (req, res) => {
  adminHelper.viewSalary().then((salary) => {
    res.render('admin/view-salary', { salary })
  })

})
router.get('/delete-salary/:id', (req, res) => {
  let proId = req.params.id;
  console.log(proId);
  adminHelper.deleteSalary(proId)
    .then((response) => {
      res.redirect('/admin/view-salary');
    })
});
router.get('/edit-salary/:id', async (req, res) => {
  try {
    const isValidObjectId = ObjectId.isValid(req.params.id);
    if (!isValidObjectId) {
      throw new Error('Invalid id');
    }
    let salary = await adminHelper.getSalaryDetails(req.params.id)
    console.log(salary);
    res.render('admin/edit-salary', { salary });
  } catch (error) {
    console.error(error);
    res.status(400).send('Bad request');
  }
})
router.post('/editSalary/:id', (req, res) => {
  adminHelper.updateSalary(req.params.id, req.body).then(() => {
    res.redirect('/admin/view-salary');
  })
})
router.get('/withdraw', (req, res) => {
  res.render('admin/withdraw')
})
router.post('/withDraw', (req, res) => {
  adminHelper.withdrawSalary(req.body).then((response) => {
    res.redirect('/admin/view-salary')
  })
})
module.exports = router;
