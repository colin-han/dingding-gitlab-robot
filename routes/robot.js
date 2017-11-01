const https = require('https');
const express = require('express');
const router = express.Router();

const {pushMessage} = require('../store/messages');

function convertMessage(e, message) {
  switch (e) {
    case 'Pipeline Hook':
      return convertPipelineEvent(message);
  }
}
function convertPipelineEvent(message) {
  if (message.status !== 'failed') {
    return null;
  }

  return JSON.stringify({
    msgtype: 'markdown',
    markdown: {
      title: 'Pipeline编译失败',
      text: `项目${message.project.namespace}/${message.project.name}编译失败\n
* _作者_: ${message.commit.author.name}
* _${message.tag ? 'Tag' : 'Branch'}_: ${message.object_attributes.ref}\n
> [更多信息](https://dev.p2m.net.cn/${message.path_with_namespace}/pipelines/${message.object_attributes.id}`
    }
  })
}
/* GET home page. */
router.post('/:projectToken/', (req, res, next) => {
  let projectToken = req.params.projectToken;
  res.end('');

  pushMessage('unknown', req.body);

  let event = req.header('X-Gitlab-Event');
  let m = convertMessage(event, req.body);
  if (!m) {
    pushMessage('dropped', req.body);
    return;
  }

  let c = https.request({
    hostname: 'oapi.dingtalk.com',
    port: 443,
    path: `/robot/send?access_token=${projectToken}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': m.length
    }
  }, (r)=> {
    if (r.statusCode !== 200) {
      pushMessage('failed', req.body, {statusCode: r.statusCode});
      r.result();
    } else {
      pushMessage('success', req.body);
    }
  });

  pushMessage('sending', req.body);
  c.write(m, 'utf8');
  c.end();

  res.end('');
});

module.exports = router;
