# WhatsApp Userbot

A simple WhatsApp userbot using `whatsapp-web.js` with persistent session via MongoDB designed to run with Github Actions.

[![CodeFactor](https://www.codefactor.io/repository/github/ayusc/whatsappbot/badge)](https://www.codefactor.io/repository/github/ayusc/whatsappbot)

# How to Deploy ?

First of all you need the MONGO_URI environment variable which is crutial for running the bot and storing the session remotely. Please follow the steps to create your MongoDB URI string:

1. Go to https://www.mongodb.com/cloud/atlas
2. Complete the sign-up/login process.
3. Choose: Deployment type: Free (Shared)
4. After that you need to create a Cluster, choose free one > Then Create Deployment
5. On next step set your password for the MongoDB connection. Don't use any special characters only use letters and numbers, otherwise you need to parse the string manually.
6. Then create the database user
7. Then under choose a connection method select Drivers. Select NodeJS (if not already selected)
8. You will get the MONGO_URI below just put your password you created earlier in place of <db_password>
9. Go to “Network Access”
10. Click “Add IP Address”
11. Click “Allow Access
12. It will fill in: 0.0.0.0/0
13. Click “Confirm”

## Setting the environment variables 

Next step is setting the environment variables on which most of the userbot commands relies on.
First of all fork the repository and then go to repository settings > Security > Secrets and Variables > Action and add new repository secret.

Here's a list of the environment variables that needs to be set:

MONGO_URI: Required
GITTOKEN: Required
ALWAYS_AUTO_DP: Required
ALWAYS_AUTO_BIO: Required
SHOW_HOROSCOPE: Optional
ZODIAC_SIGN: Optional
CITY: Optional
IMAGE_URL: Optional
AUTO_DP_INTERVAL_MS: Optional
TIME_ZONE: Optional
AUTO_BIO_INTERVAL_MS: Optional

## Deploying
After you have done all the above steps go to your Github Actions, then select the "Whatsapp Bot" workflow and run it.
At the Run Bot step you will be provided a QR for first time login. You need to scan the QR code with your mobile device. Please zoom out your page to 50% to properly scan the QR.
After logged in the userbot is ready to use and the session is successfully saved to your MongoDB Cluster.

# Trobleshooting

In rare circumstances the userbot may crash due to session zip corruption in that case you need to manually drop the database which contains the RemoteAuth session files and after that you can again login via QR (from git actions)
