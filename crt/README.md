# How to create a self-signed certificate

## Create a key and a self-signed certificate
~~~ bash
/usr/bin/openssl req -newkey rsa:2048 -nodes -keyout ./api_server.key -x509 -sha256 -days 365 -subj "/C=CY/ST=Cyprus/L=Limassol/O=IPS IT Labs./OU=ASKUG/CN=askug.net" -addext "subjectAltName = DNS:api.askug.net, IP:192.168.10.19" -out ./api_server.crt
~~~

## Add the certificate to the storage on MacOS

### To the system storage

~~~ bash
sudo security add-trusted-cert \
  -d \
  -r trustRoot \
  -k /Library/Keychains/System.keychain \
  <certificate>
~~~

### To the user storage
~~~ bash
security add-trusted-cert \
  -d \
  -r trustRoot \
  -k $HOME/Library/Keychains/login.keychain \
  <certificate>
~~~


## Add the certificate to the storage on Ubuntu/Debian

~~~ bash
sudo cp <certificate> /etc/ssl/certs
sudo update-ca-certificates --fresh --verbose
~~~
