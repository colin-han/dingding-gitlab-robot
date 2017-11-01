const express = require('express');
const router = express.Router();

const {latestMessage} = require('../store/messages');

/* GET home page. */
router.get('/', function (req, res, next) {
  let message = latestMessage();
  res.render('index', {
    title: 'PTM DingDing Robot',
    success: message.success,
    latestMessage: JSON.stringify(message.content, '', '  '),
    errorMessage: JSON.stringify(message.message || {}, '', '  ')
  });
});

module.exports = router;
