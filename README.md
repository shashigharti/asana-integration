### Configure Asana Webhook
1. Configure a website and setup ssl
2. Create a webhook by running the command as described in the doc: https://asana.com/developers/api-reference/webhooks#create

#### Request
curl -H "Authorization: Bearer <personal_access_token>" \
-X POST https://app.asana.com/api/1.0/webhooks \
-d "resource=8675309" \
-d "target=https://example.com/receive-webhook/7654"

#### Handshake sent to https://example.com/
POST /receive-webhook/7654
X-Hook-Secret: b537207f20cbfa02357cf448134da559e8bd39d61597dcd5631b8012eae53e8

Once the validation is done, the events are sent to that url by asana.

3. For personal access token generation, go to "My Profile Setting" ->Apps -> Manage Developers App -> Create new personal access token

### Configure Slack Interactive Messages and Bot



### Configure Airtable API




### Set Nodejs Server (Nginx Proxy and SSL)
