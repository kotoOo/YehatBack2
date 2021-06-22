REM ---------------[ Yehat Generating SSL keys ]------------------------------------------------------------------------

SET PATH=%PATH%;D:\soft\openssl\bin
SET OPENSSL_CONF=D:\soft\openssl\openssl.cnf   
DEL .\.rnd

REM ######################
REM # Become a Certificate Authority
REM ######################

REM # Generate private key
openssl genrsa -des3 -out myCA.key 2048
REM # Generate root certificate
openssl req -x509 -new -nodes -key myCA.key -sha256 -days 825 -out myCA.pem

REM ######################
REM # Create CA-signed certs
REM ######################

SET NAME=localhost
REM # Generate a private key
openssl genrsa -out ../keys/%NAME%.key 2048
REM # Create a certificate-signing request
openssl req -new -key ../keys/%NAME%.key -out %NAME%.csr
REM # Create a config file for the extensions
REM ... see localhost.ext

REM # Create the signed certificate
openssl x509 -req -in %NAME%.csr -CA myCA.pem -CAkey myCA.key -CAcreateserial -out ../keys/%NAME%.crt -days 825 -sha256 -extfile %NAME%.ext


