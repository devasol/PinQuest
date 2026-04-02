const axios = require('axios');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

let googlePublicKeys = null;
let lastFetchTime = 0;
const CACHE_DURATION = 3600000; // 1 hour

/**
 * Fetch Google's public keys for Firebase token verification
 */
const fetchPublicKeys = async () => {
    const now = Date.now();
    if (googlePublicKeys && (now - lastFetchTime < CACHE_DURATION)) {
        return googlePublicKeys;
    }

    try {
        const response = await axios.get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
        googlePublicKeys = response.data;
        lastFetchTime = now;
        return googlePublicKeys;
    } catch (error) {
        logger.error('Error fetching Google public keys:', error.message);
        throw new Error('Failed to fetch Google public keys');
    }
};

/**
 * Verify a Firebase ID token without using the Private Key (using Public Keys)
 * @param {string} token - The Firebase ID token
 * @returns {Promise<object>} - The decoded token payload
 */
const verifyFirebaseToken = async (token) => {
    try {
        const decodedHeader = jwt.decode(token, { complete: true });
        if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
            throw new Error('Invalid token format or missing kid header');
        }

        const keys = await fetchPublicKeys();
        const publicKey = keys[decodedHeader.header.kid];

        if (!publicKey) {
            throw new Error('Public key not found for kid');
        }

        const projectId = process.env.FIREBASE_PROJECT_ID;
        if (!projectId) {
            throw new Error('FIREBASE_PROJECT_ID not configured on server');
        }

        // Verify signature and claims
        const decoded = jwt.verify(token, publicKey, {
            algorithms: ['RS256'],
            audience: projectId,
            issuer: `https://securetoken.google.com/${projectId}`
        });

        return decoded;
    } catch (error) {
        logger.debug('Firebase token verification failed:', error.message);
        throw error;
    }
};

module.exports = {
    verifyFirebaseToken
};
