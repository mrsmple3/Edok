#!/bin/bash
openssl pkcs7 -in "$1" -inform DER -print_certs -text
