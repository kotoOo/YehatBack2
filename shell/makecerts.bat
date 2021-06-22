REM ---------------[ Yehat Generating SSL keys ]------------------------------------------------------------------------

SET PATH=%PATH%;D:\soft\openssl\bin
SET OPENSSL_CONF=D:\soft\openssl\openssl.cnf   
REM ECHO %PATH%

openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout ../keys/yehat-local-00.key -out ../keys/yehat-local-00.crt
