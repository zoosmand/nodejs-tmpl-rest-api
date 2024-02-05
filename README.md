# nodejs-tmpl-rest-api
The template REST API for any purposes

## Links
<https://www.sqlitetutorial.net/sqlite-nodejs/connect/>

---

## API

### Users

#### Create a user

~~~ bash
curl -i -k -X POST -H 'Content-Type: application/json' https://localhost:3001/users -d '{"firstName":"John", "lastName":"Smith", "phone":"1234567890", "password":"***", "tosAgreement":true}'
~~~

#### Get the user

~~~ bash
curl -i -k -X GET -H 'Content-Type: application/json' -H 'token: ***token***' https://localhost:3001/users?phone=1234567890
~~~

#### Update the user

~~~ bash
curl -i -k -X PUT -H 'Content-Type: application/json' -H 'token: ***token***' https://localhost:3001/users -d '{"phone":"1234567890", "firstName":"Jack", "lastName":"Smyth", "password":"***"}'
~~~

#### Delete the user

~~~ bash
curl -i -k -X DELETE -H 'Content-Type: application/json' -H 'token: ***token***' https://localhost:3001/users?phone=1234567890
~~~

---

### Tokens

#### Create a token

~~~ bash
curl -i -k -X POST -H 'Content-Type: application/json' https://localhost:3001/tokens -d '{"phone":"1234567890", "password":"***"}'
~~~

#### Get the token info

~~~ bash
curl -i -k -X GET -H 'Content-Type: application/json' https://localhost:3001/tokens?id=***token***
~~~

#### Extend the token expiry

~~~ bash
curl -i -k -X PUT -H 'Content-Type: application/json' https://localhost:3001/tokens -d '{"id":"***token***", "extend":true}'
~~~

#### Delete the token

~~~ bash
curl -i -k -X DELETE -H 'Content-Type: application/json' https://localhost:3001/tokens?id=***token***
~~~
