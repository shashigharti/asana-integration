module.exports = {
    server: {
        hostname: '127.0.0.1',
        port: 3000
    },
    asana:{
        token: '',
        base_url: 'https://app.asana.com/api/1.0',
        headers: {
            'Authorization': 'Bearer <token>'
        }
    },
    slack:{
        bot:{
            post_message_url: 'https://slack.com/api/chat.postMessage',
            headers: {
                'Authorization': 'Bearer <token>',
                'Content-Type': 'application/json'
            }
        }

    },
    airtable:{
        base_url: "https://api.airtable.com/v0/appohapUWdo5okapf/Developers",
        headers:{
            'Authorization': 'Bearer <token>',
            'Content-Type': 'application/json'
        },
        api_key: '<api_key>'

    },
    debug: true
};