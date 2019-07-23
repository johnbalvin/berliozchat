CREATE DATABASE IF NOT EXISTS demo;

USE demo;   

CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Username varchar(100) NOT NULL UNIQUE,
    Registrationday BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Content varchar(500) NOT NULL,
    Datesend BIGINT NOT NULL,
    Typemess  INT NOT NULL,
    Fromuser varchar(100) NOT NULL,
    MimeType varchar(100) /*only for file types*/
);
