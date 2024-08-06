curl -i -k -H 'Content-Type: application/json' https://localhost:3001/users -X POST \
        -d '{
            "firstName":"John", 
            "lastName":"Smith", 
            "phone":"1234567890", 
            "email":"john\@mail.com", 
            "address":"14021, Evergreen str., Springfield, MO", 
            "password":"KaliMera", 
            "tosAgreement":true
        }'


curl -i -k -H 'Content-Type: application/json' https://localhost:3001/tokens -X POST \
    -d '{
        "email":"john\@mail.com", 
        "password":"KaliMera"
    }'


curl -i -k -H 'Content-Type: application/json' https://localhost:3001/users -X GET -H 'Authorization: i3Rv9c-^XSQr_NE2wzZH'


curl -i -k -H 'Content-Type: application/json' https://localhost:3001/users -X PUT -H 'Authorization: i3Rv9c-^XSQr_NE2wzZH' \
    -d '{
        "address":"14023, Evergreen str., Springfield, MO",
        "password":"KaliMera2"
    }'

curl -i -k -H 'Content-Type: application/json' https://localhost:3001/users -X PUT -H 'Authorization: i3Rv9c-^XSQr_NE2wzZH' \
    -d '{
        "firstName":"Homer", 
        "lastName":"Simpson"
    }'

# ---

curl -i -k -H 'Content-Type: application/json' https://localhost:3001/orders -X POST -H 'Authorization: i3Rv9c-^XSQr_NE2wzZH'

curl -i -k -H 'Content-Type: application/json' https://localhost:3001/orders -X GET -H 'Authorization: i3Rv9c-^XSQr_NE2wzZH'

curl -i -k -H 'Content-Type: application/json' https://localhost:3001/orders?orderId=245551 -X GET -H 'Authorization: i3Rv9c-^XSQr_NE2wzZH'

# ---

curl -i -k -H 'Content-Type: application/json' https://localhost:3001/items -X GET -H 'Authorization: i3Rv9c-^XSQr_NE2wzZH'

curl -i -k -H 'Content-Type: application/json' https://localhost:3001/items?itemId=569142 -X GET -H 'Authorization: i3Rv9c-^XSQr_NE2wzZH'

# ---

curl -i -k -H 'Content-Type: application/json' https://localhost:3001/orders -X PUT -H 'Authorization: i3Rv9c-^XSQr_NE2wzZH' \
    -d '{
        "orderId":526469, 
        "itemId":569142, 
        "itemQuantity":3
    }'

curl -i -k -H 'Content-Type: application/json' https://localhost:3001/orders -X PUT -H 'Authorization: i3Rv9c-^XSQr_NE2wzZH' \
    -d '{
        "orderId":526469, 
        "itemId":528365, 
        "itemQuantity":2
    }'

curl -i -k -H 'Content-Type: application/json' https://localhost:3001/orders -X PUT -H 'Authorization: i3Rv9c-^XSQr_NE2wzZH' \
    -d '{
        "orderId":526469, 
        "itemId":112391, 
        "itemQuantity":5
    }'




