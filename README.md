### CRYPTO BOT
- A simple crypto bot that automates the process of claiming XRP tokens every minutes at [Faucetearner](https://faucetearner.org/)

## Features
- Completely written in [Typescript](https://typescriptlang.org/)
- [Nestjs](https://docs.nestjs.com/) Nodejs framework

#### Run
- clone repo
- run `yarn install`
- run `npx puppeteer browsers install chrome`
- add the path of the chrome executable to your env
- run `yarn run start:dev`

### Logs
- On your env, specify
- CREDENTIALS_PATH: path to json file with login credentials
``
    [
        {
            "email": "test@mail.com",
            "password": "password"
        },
        {
            "email": "test2@mail.com",
            "password": "password"
        }
    ]
``
- ERROR_PATH: path to a .txt file to log errors
- SUCCESS_PATH: path to a .txt file to log success


