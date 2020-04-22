const axios = require('axios')
const Base64 = require('js-base64').Base64;

const config = require('config')
const xgpushConfig = config.get('xgpush');

const PushApp = "https://openapi.xg.qq.com/v3/push/app"
const DeviceTag = "https://openapi.xg.qq.com/v3/device/tag"

function XingeApp(xgpushConfig) {

    this.config = xgpushConfig;
    /**
     * 推送消息
     * 参数：
     * notification.category 分类(必传)
     * notification.userId 用户ID(必传)
     * notification.title 标题(必传)
     * notification.content 内容(必传)
     * notification.url 跳转链接
     * notification.extras 扩展参数
     * notification.scheduleTime 定时发送时间 格式"2016-08-08 18:00:00"
     * @returns {Promise<void>}
     */
    this.pushById = function (id, notification) {
        this.config = xgpushConfig;
        let base64_auth_string
        let params = {
            "audience_type": "token",
            "environment": this.config.ios.environment,
            "token_list": [id],
            "message_type": "notify",
            "message": {
                "title": notification.title,
                "content": notification.content,
                "ios": {
                    "aps": {
                        "alert": {
                            "subtitle": notification.category
                        },
                        "badge_type": -2,
                        "sound": "Tassel.wav",
                        "category": "INVITE_CATEGORY"

                    },
                    // "custom1": "bar",
                    // "custom2": [
                    //     "bang",
                    //     "whiz"
                    // ],
                    "xg": "oops"
                }
            }
        }
        if (id.length === 64) { // IOS
            base64_auth_string = Base64.encode(this.config.ios.appId + ":" + this.config.ios.secretKey);
            params.platform = "ios"
            params.message = {
                "title": notification.title,
                "content": notification.content,
                "ios": {
                    "aps": {
                        "alert": {
                            // "subtitle": notification.category
                        },
                        "badge_type": -2,
                        "sound": "Tassel.wav",
                        "category": "INVITE_CATEGORY"

                    },
                    // "custom1": "bar",
                    // "custom2": [
                    //     "bang",
                    //     "whiz"
                    // ],
                    "xg": "oops"
                }
            }
            if (notification.extras) {
                for (let key in notification.extras) {
                    params.message.ios[key] = notification[key]
                }
            }
        } else if (id.length === 40) { // Android
            base64_auth_string = Base64.encode(this.config.android.appId + ":" + this.config.android.secretKey);
            params.platform = "android"
            params.message = {
                title: notification.title,
                content: notification.content,
            }
            if (notification.url) {
                params.message.xg_media_resources = notification.url
            }
            if (notification.extras) {
                params.message.android.custom_content = notification.extras
            }
        }
        let test = {

            "platform": "ios",
            "audience_type": "token",
            "environment": "dev",
            "token_list": [id],
            "message_type": "notify",
            "message": {
                "title": "xxx",
                "content": "https://xg.qq.com/docs/ios_access/ios_faq.html",
                "ios": {
                    "aps": {
                        "alert": {
                            "subtitle": "my subtitle"
                        },
                        "badge_type": -2,
                        "sound": "Tassel.wav",
                        "category": "INVITE_CATEGORY"

                    },
                    "custom1": "bar",
                    "custom2": [
                        "bang",
                        "whiz"
                    ],
                    "xg": "oops"
                }
            }
        }
        axios.post(PushApp, params, {
            headers: {
                Authorization: "Basic " + base64_auth_string
            }
        }).then(res => {
            console.log("pass", res.data)
        }).catch(err => {
            console.log("error", err.data)
        })
    }
}

exports.XingeApp = XingeApp;
