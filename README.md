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
        -d '{
            "firstName":"John", 
            "lastName":"Smith", 
            "phone":"1234567890", 
            "email":"john\@mail.com", 
            "address":"14021, Evergreen str., Springfield, MO", 
            "password":"***", 
            "tosAgreement":true
        }'
    ~~~

- Get the user

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/users -X GET -H 'Authorization: ***token***'
    ~~~

- Update the user (either all, or a single parameter )

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/users -X PUT -H 'Authorization: ***token***' \
        -d '{
            "firstName":"John", 
            "lastName":"Smith", 
            "address":"14023, Evergreen str., Springfield, MO", 
            "password":"***"
        }'
    ~~~

- Delete the user

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/users -X DELETE -H 'Authorization: ***token***'
    ~~~

---

### Tokens

- Create a token

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/tokens -X POST \
    -d '{
        "email":"john\@mail.com", 
        "password":"***"
    }'
    ~~~

- Extend the token expiry

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/tokens -X PUT -H 'Authorization: ***token***'
    ~~~

- Delete the token

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/tokens -X DELETE -H 'Authorization: ***token***'
    ~~~

---

### Items (Goods)

- Get list of items (goods)

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/items -X GET -H 'Authorization: ***token***'
    ~~~

- Get a particular item (good)

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/items?itemId=***itemId*** -X GET -H 'Authorization: ***token***'
    ~~~

---

### Orders

- Create an order

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/orders -X POST -H 'Authorization: ***token***'
    ~~~

- Get list of orders

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/orders -X GET -H 'Authorization: ***token***'
    ~~~

- Get a particular order

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/orders?orderId=***orderId*** -X GET -H 'Authorization: ***token***'
    ~~~

- Add an item to the order

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/orders -X PUT -H 'Authorization: ***token***' \
    -d '{
        "orderId":***orderId***, 
        "itemId":***itemId***, 
        "itemQuantity":***quantity***
    }'

    ~~~

- Delete the order

    ~~~ bash
    curl -i -k -H 'Content-Type: application/json' https://localhost:3001/orders?orderId=***orderId*** -X DELETE -H 'Authorization: ***token***'
    ~~~
