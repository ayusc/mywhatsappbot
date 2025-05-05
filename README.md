# WahBuddy
Blazing fast WhatsApp userbot using [Baileys](https://github.com/WhiskeySockets/Baileys) with persistent session coupled with MongoDB

> [!WARNING]
> **It is not guaranteed you will not be blocked by using this bot. WhatsApp does not allow bots or unofficial clients on their platform, so this shouldn't be considered totally safe.<br>Use it at your own risk !!!**

[![CodeFactor](https://www.codefactor.io/repository/github/ayusc/wahbuddy/badge)](https://www.codefactor.io/repository/github/ayusc/wahbuddy)

# How to Deploy ?

Click on the below button to deploy WahBuddy in one click ->

[![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?type=git&repository=https://github.com/ayusc/WahBuddy&branch=main&name=wahbuddy)


## Setting the environment variables

First of all you need the MONGO_URI environment variable which is crutial for running the bot and storing the session remotely. Please follow the steps to create your MongoDB URI string:

1. Go to https://www.mongodb.com/cloud/atlas
2. Complete the sign-up/login process.
3. Choose: Deployment type: Free (Shared)
4. After that you need to create a Cluster, choose free one > Then Create Deployment
5. On next step set your password for the MongoDB connection. Don't use any special characters only use letters and numbers, otherwise you need to parse the string manually.
6. Then create the database user
7. Then under choose a connection method select Drivers. Select NodeJS (if not already selected)
8. You will get the MONGO_URI below just put your password you created earlier in place of <db_password>
9. In Dashboard Go to “Network Access”
10. Click “Add IP Address”
11. Click “Allow Access
12. It will fill in: 0.0.0.0/0
13. Click “Confirm”

Next step is setting the environment variables on which most of the userbot commands relies on.
First of all fork this repository and then go to your forked repository settings > Security > Secrets and Variables > Action and add new repository secret.

Here's a list of the environment variables that needs to be set:

| Field                  | Type    | Description                                                                   | Mandatory |
| ---------------------- | ------- | ----------------------------------------------------------------------------- | --------- |
| `MONGO_URI`            | String  | Required for storing the RemoteAuth session. Without this, the bot won't run. | Yes       |
| `GITTOKEN`             | String  | Required for cancelling and dispatching GitHub workflows.                     | Yes       |
| `ALWAYS_AUTO_DP`       | Boolean | Whether the user wants the AutoDP feature to start on boot.                   | No        |
| `ALWAYS_AUTO_BIO`      | Boolean | Whether the user wants the AutoBio feature to start on boot.                  | No        |
| `SHOW_HOROSCOPE`       | Boolean | Whether to show the current horoscope on the user's profile picture.          | No        |
| `ZODIAC_SIGN`          | String  | The zodiac sign or sunsign of the user (required if using `SHOW_HOROSCOPE`).  | No        |
| `CITY`                 | String  | The city where the user resides (required for AutoDP).                        | No        |
| `IMAGE_URL`            | String  | The URL containing the user's profile picture (required for AutoDP).          | No        |
| `TIME_ZONE`            | String  | The time zone where the user resides (e.g., `Asia/Kolkata`).                  | No        |
| `AUTO_DP_INTERVAL_MS`  | Integer | How often the user's DP should be updated (in milliseconds).                  | No        |
| `AUTO_BIO_INTERVAL_MS` | Integer | How often the user's bio should be updated (in milliseconds).                 | No        |
| `OCR_SPACE_API_KEY`    | String  | Required for the .ocr command. Obtain it from https://ocr.space               | Yes       |
| `RMBG_API_KEY`    | String  | Required for the .rmbg command. Obtain it from https://www.remove.bg               | Yes       |

## Deploying

After logged in the userbot is ready to use and the session is successfully saved to your MongoDB Cluster.

# Trobleshooting

In rare circumstances the userbot may crash due to session file corruption in that case you need to manually drop the database which contains the whatsapp session files and after that you can again login via QR from koyeb logs
