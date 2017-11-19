const https = require('https');
const express = require('express');
const router = express.Router();

const {pushMessage} = require('../store/messages');
const {updateState} = require('../store/project-state');

function convertMessage(e, message) {
  switch (e) {
    case 'Pipeline Hook':
    case 'Pipeline Event': // for test
      return convertPipelineEvent(message);
  }
  return {error: "No matched X-Gitlab-Event header"}
}
function convertPipelineEvent(message) {
  if (!updateState(message)) {
    return {error: "Project state no change."};
  }

  if (message.object_attributes.status !== 'failed') {
    return {
      message: {
        msgtype: 'markdown',
        markdown: {
          title: '编译正常',
          text: `![Success](http://114.215.16.218:13005/images/success.png) **编译恢复正常**  
- - -
* _项目_: **${message.project.namespace}/${message.project.name}**
* _作者_: **${message.commit.author.name}**
* _${message.object_attributes.tag ? 'Tag' : 'Branch'}_: **${message.object_attributes.ref}**\n
* _提交_: 
> ${message.commit.message}
- - -
> [更多信息](https://dev.p2m.net.cn/${message.project.path_with_namespace}/pipelines/${message.object_attributes.id})`
        }
      }
    }
  }

  return {
    message: {
      msgtype: 'markdown',
      markdown: {
        title: "编译失败",
        text: `![Error](http://114.215.16.218:13005/images/error.png) **编译失败**  
- - -
* _项目_: **${message.project.namespace}/${message.project.name}**
* _作者_: **${message.commit.author.name}**
* _${message.object_attributes.tag ? 'Tag' : 'Branch'}_: **${message.object_attributes.ref}**\n
* _提交_: 
> ${message.commit.message}
- - -
> [更多信息](https://dev.p2m.net.cn/${message.project.path_with_namespace}/pipelines/${message.object_attributes.id})`
      }
    }
  };
}
/* GET home page. */
router.post('/:projectToken/', (req, res, next) => {
  let projectToken = req.params.projectToken;
  res.end('');

  pushMessage('unknown', req.body);

  let event = req.header('X-Gitlab-Event');
  let result = convertMessage(event, req.body);
  if (!result.message) {
    pushMessage('dropped', req.body, result.error);
    return;
  }

  let m = JSON.stringify(result.message);

  console.log(`POST https://oapi.dingtalk.com/robot/send?access_token=${projectToken}`);
  console.log('  ' + m);
  let c = https.request({
    hostname: 'oapi.dingtalk.com',
    port: 443,
    path: `/robot/send?access_token=${projectToken}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, (r)=> {
    if (r.statusCode !== 200) {
      pushMessage('failed', req.body, {statusCode: r.statusCode});
      r.result();
    } else {
      let data = '';
      r.on('data', (b)=>data += b);
      r.on('end', ()=>{
        let result2 = JSON.parse(data);
        if (result2.errcode !== 0) {
          pushMessage('failed', req.body, result2);
        } else {
          pushMessage('success', req.body);
        }
      });
    }
  });

  pushMessage('sending', req.body);
  c.write(m, 'utf8');
  c.end();
});

module.exports = router;
