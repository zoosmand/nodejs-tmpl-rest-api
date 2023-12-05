# How to create a self-signed certificate

## Self-signed certificate
~~~ bash
/usr/bin/openssl req -newkey rsa:2048 -nodes -keyout ./api_server.key -x509 -sha256 -days 365 -subj "/C=CY/ST=Cyprus/L=Limassol/O=IPS IT Labs./OU=ASKUG/CN=askug.net" -addext "subjectAltName = DNS:api.askug.net, IP:192.168.10.19" -out ./api_server.crt
~~~

## Add the certificate to the storage on MacOS

### System storage

~~~ bash
sudo security add-trusted-cert \
  -d \
  -r trustRoot \
  -k /Library/Keychains/System.keychain \
  <certificate>
~~~

### User storage
~~~ bash
security add-trusted-cert \
  -d \
  -r trustRoot \
  -k $HOME/Library/Keychains/login.keychain \
  <certificate>
~~~
