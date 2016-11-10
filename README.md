# WebChat
A simple Web based Chat Application for sending and receiving private and group messages

WebChat provides its user an interface for communicating with each other, sending/receiving files and messages, creating group converstaions.
AngularJs is used as a front-end framework supported by NodeJs at backend. HTML/CSS, Twitter Bootstrap are used for styling the web page along with custom CSS file. Various Angular Modules extracted from angular libraries, like ng-dialog, angular-resource, angular-ui-router, angular-notify, ng-file-upload, etc, are used for providing the neccesary web page components which were customized as per needs.
Socket.io is being used as a third party library for sending and receiving data packets in realtime. Express, a backend framework for NodeJs applications, Multiparty , Socket.io and other middlewares are used in NodeJs for supporting the front end architecture.

## Prerequisites

* Git: Download and install git for your machine.
* Node.js: Download and install node.js and npm package manager
* Bower: Download and install bower package managerto manage front end dependencies. First install node and npm and then install bower globally using npm:
```
$ npm install -g bower
```

## Installation instructions
 
 After cloning the github repository and installing all the prequisites, we are just a few steps away to start the WebChat application.
 The boilerplate comes pre-bundled with package.json and bower.json files that contains the modules which we need to start the application.
 
 For installing the server side dependencies , run the following command in the terminal after moving to root directory:
 
 ``` 
 $ npm install
 ```
 
 For installing front end dependencies use bower commands after moving inside the public folder of WebChat app.

``` 
$ bower install 
```  
will install all the packages specified in bower.json file inside the public folder.

## Running the application
 
 Specifying the main server file, which is index.js in our case, with the node command will start our server in development mode.
```
$ node index.js
```
The application will run on port 3000, so go to [http://localhost:3000] (http://localhost:3000) in the browser.

## App Features

### Screens
* A Sign Up Screen for adding users to WebChat with full form validation(including async usernmae validation, displaying error messages for username unavailability).
* A Chat Portal showing friends who are online, created groups and a chat box.

###Features of Chat Screen
* Messages are sent and received at realtime, therfore no latency is encountered.
* Every message is associated with some meta-data, Senders name, delivery time and week day.
* A name indicator, white to yellow color transition, which shows you have some pending messages to view.
* A typing indicator for showing that someone "is typing" a message for you.
* Notification Message which pops up at top as soon as someone joins the WebChat application. The corresponding person will be added to your friend list, and is available for chat.
* Similar Notification Message when one leaves the WebChat.
* Chat logs are preserved and are in memory. Therefore, user can always switch persons and can view his previous chats with anyone at anytime.
* Photo sharing feature allows to share any image file with the other user, with all the shared files being saved at '/UploadedFiles' folder.
* Group Chat Dialogue Box which shows all the required fields(name, tagline and members) to be populated for creating a group Chat.

