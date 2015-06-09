## Simple Long Polling Chat

Simple long polling chat web using Laravel5 and AngularJS.
This repository created just for testing laravel5 with angularjs purposes only.

### How to setup

####Create Virtual Host
**Create 2 Virtual Hosts**. Both virtual hosts used for Webservice and for client.
Don't use Built in php server, we are using long polling. Using built in php server in long polling will blocking all request to server. We must use Apache/nginx/cowboy or other production web server.

- Set folder `server` as web service document root and directory. 
as we see at file `resources/assets/angular/home/home.config.js` I am using chatty.dev for remote endpoint, we can use chatty.dev for hostname or else we can change it but we should update configuration & rebuild script files using elixir.

-  Set folder `public` as frontend / web client document root and directory.

Once we've done creating virtualhost don't forget to restart webserver.

####Configure Laravel5 Project
- Create `.env` file in root project folder, we can copy it from `.env.example`
- Configure `.env` file.
- Run migration via console using `php artisan migrate:install`
- Go to frontend / web client host via web browser
