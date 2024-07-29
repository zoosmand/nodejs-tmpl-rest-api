# nodejs-tmpl-rest-api
The template REST API for any purposes

## Links
<https://www.sqlitetutorial.net/sqlite-nodejs/connect/>

---

## API

### Prerequisites

- Install SQLite3 library
    
    ~~~ bash
    npm install sqlite3
    ~~~

### Users

- Create a user

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/users -X POST \
        -d '{"firstName":"John", "lastName":"Smith", "phone":"1234567890", email:"john@mail.com", "password":"***", "tosAgreement":true}'
    ~~~

- Get the user

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/users -X GET -H 'Authorization: ***token***'
    ~~~

- Update the user

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/users -X PUT -H 'Authorization: ***token***' \
        -d '{"firstName":"Jack", "lastName":"Smyth", "password":"***"}'
    ~~~

- Delete the user

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/users -X DELETE -H 'Authorization: ***token***'
    ~~~

---

### Tokens

- Create a token

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/tokens -X POST -d '{"phone":"1234567890", "password":"***"}'
    ~~~

- Get the token info

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/tokens -X GET -H 'Authorization: ***token***'
    ~~~

- Extend the token expiry

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/tokens -X PUT -H 'Authorization: ***token***' \
        -d '{"extend":true}'
    ~~~

- Delete the token

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/tokens -X DELETE -H 'Authorization: ***token***'
    ~~~
