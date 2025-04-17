# WhatsApp Userbot

A simple WhatsApp userbot using `whatsapp-web.js` with persistent session via MongoDB designed to run with Github Actions.

[![CodeFactor](https://www.codefactor.io/repository/github/ayusc/whatsappbot/badge)](https://www.codefactor.io/repository/github/ayusc/whatsappbot)

# How to Deploy ?

First of all you need the MONGO_URI and GITTOKEN environment variables which is crutial for running the bot and storing the session remotely. Please follow the steps to create your MongoDB URI string:

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

Next click on your GitHub profile go to Settings > Developer settings > Personal access tokens.
Select Tokens (classic)
Then Generate a new token (classic)
Under select scopes select everything.
Under expiration set it to No expiration
You will be provided the github personal access token (copy and paste it somewhere) 
You need to set it as your GITTOKEN on next step.

## Setting the environment variables 

Next step is setting the environment variables on which most of the userbot commands relies on.
First of all fork the repository and then go to repository settings > Security > Secrets and Variables > Action and add new repository secret.

Here's a list of the environment variables that needs to be set:

• MONGO_URI: Required<br>
• GITTOKEN: Required<br>
• ALWAYS_AUTO_DP: Optional<br>
• ALWAYS_AUTO_BIO: Optional<br>
• SHOW_HOROSCOPE: Optional<br>
• ZODIAC_SIGN: Optional<br>
• CITY: Optional<br>
• IMAGE_URL: Optional<br>
• AUTO_DP_INTERVAL_MS: Optional<br>
• TIME_ZONE: Optional<br>
• AUTO_BIO_INTERVAL_MS: Optional

## Deploying
After you have done all the above steps go to your Github Actions, then select the "Whatsapp Bot" workflow and run it.
At the Run Bot step you will be provided a QR for first time login. You need to scan the QR code with your mobile device. Please zoom out your page to 50% to properly scan the QR.
After logged in the userbot is ready to use and the session is successfully saved to your MongoDB Cluster.

### Note
The Github Action workflow cannot run endlessly (it can run for maximum 6 hours) so the userbot will Cancel the workflow automatically after 5 hours and dispatch a new one immediately. So the bot will be down for some time. It usually takes 4-5 mins for the bot to be back again.

# Trobleshooting

In rare circumstances the userbot may crash due to session zip corruption in that case you need to manually drop the database which contains the RemoteAuth session files and after that you can again login via QR (from git actions)
