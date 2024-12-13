
// shared.ts
import { HeadersConfig } from './types';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

export function getHeaders(
    timestamp: string,
    method: string,
    requestPath: string,
    queryString = ""
): HeadersConfig {
    const apiKey = process.env.REACT_APP_API_KEY;
    const secretKey = process.env.REACT_APP_SECRET_KEY;
    const apiPassphrase = process.env.REACT_APP_API_PASSPHRASE;
    const projectId = process.env.REACT_APP_PROJECT_ID;

    if (!apiKey || !secretKey || !apiPassphrase || !projectId) {
        throw new Error("Missing required environment variables");
    }

    const stringToSign = timestamp + method + requestPath + queryString;

    return {
        "Content-Type": "application/json",
        "OK-ACCESS-KEY": apiKey,
        "OK-ACCESS-SIGN": CryptoJS.enc.Base64.stringify(
            CryptoJS.HmacSHA256(stringToSign, secretKey)
        ),
        "OK-ACCESS-TIMESTAMP": timestamp,
        "OK-ACCESS-PASSPHRASE": apiPassphrase,
        "OK-ACCESS-PROJECT": projectId
    };
}