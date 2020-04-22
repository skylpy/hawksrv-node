const L = require('debug')('app:api');
const config = require('config');
const SMSClient = require('@alicloud/sms-sdk');
const OSS = require('ali-oss');
const { RPCClient } = require('@alicloud/pop-core');

const aliyun = config.get('aliyun');

function sendVeriCode(phone, code) {
    let smsClient = new SMSClient({'accessKeyId': aliyun.user.accessKeyId, 
                                   'secretAccessKey': aliyun.user.secretAccessKey});

    let smsParams = {
        PhoneNumbers: phone,
        SignName: aliyun.sms.signName,
        TemplateCode: aliyun.sms.templateCode,
        TemplateParam: JSON.stringify({code})
    };

    L('Calling SMS API with parameters: %o', smsParams);

    return smsClient.sendSMS(smsParams)
            .then(function (res) {
                L('SMS API calls returning %O', res);
                return true;
            });
};

async function getOssRole(who) {
    if (!who) {
        throw new Error('Anonymous access to OSS role is forbidden');
        return;
    }
    let sts = new OSS.STS({
        accessKeyId: aliyun.user.accessKeyId,
        accessKeySecret: aliyun.user.secretAccessKey
    });

    let policy = {
        "Statement": [
          {
            "Action": [
              "oss:*", // TODO this permission must be restricted
            ],
            "Effect": "Allow",
            "Resource": [`acs:oss:*:*:${aliyun.oss.bucket}/*`]
          }
        ],
        "Version": "1"
    };

    try {
        let resp = await sts.assumeRole(    aliyun.oss.role, 
                                            policy, 
                                            aliyun.oss.expiracy, 
                                            who);
    
        L('successfully get oss role with user', who);
        L('oss credentials', resp.credentials);

        return resp.credentials;
    
    } catch (err) {
        L(err);
        throw err;
    }
}

function getOssConfig() {
    return aliyun.oss;
}

async function getPreviewUrl(filename) {
    let Project = 'hawkzn';

    const client = new RPCClient({
        endpoint: 'http://imm.cn-shenzhen.aliyuncs.com',
        accessKeyId: aliyun.user.accessKeyId,
        accessKeySecret: aliyun.user.secretAccessKey,
        apiVersion: '2017-09-06'
    });

    try{
        let result = await client.request("CreateOfficeConversionTask", {
            Project,
            SrcUri: 'oss://hawkbet/' + filename,
            TgtType: 'vector',
            TgtUri: 'oss://hawkbet/converttask/' + filename.replace(/\./g, '_')          
        });

        let TaskId = result.TaskId;
        let reTryTimes = 5;
        result = {};

        while (reTryTimes-- > 0) {
            await delay(1000);

            result = await client.request("GetOfficeConversionTask", {
                Project,
                TaskId
            });

            if(result && result.Status == "Finished"){
                console.log(result);
                break;
            }
            if(result && result.Status == "Failed"){
                console.log(result);
                break;
            }
        }

        return result;

        async function delay(ms) {
          return new Promise((a, b) => {
            setTimeout(a, ms);
          });
        }

    } catch(err){
        console.error(err);
    }
      
}

module.exports = {
    sendVeriCode,
    getOssRole,
    getOssConfig,
    getPreviewUrl,
};