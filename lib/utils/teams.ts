import crypto from 'crypto';

const TEAMS_SIGNING_KEY = process.env.TEAMS_SIGNING_KEY || 'your-signing-key';

/**
 * Validates the Teams signature in the authorization header
 * @param authHeader The authorization header from the Teams request
 * @param body The request body to validate
 * @returns boolean indicating if the signature is valid
 */
export function validateTeamsSignature(authHeader: string, body: any): boolean {
    try {
        // Extract signature from authorization header
        const [scheme, signature] = authHeader.split(' ');
        if (scheme !== 'HMAC' || !signature) {
            return false;
        }

        // Create HMAC signature
        const hmac = crypto.createHmac('sha256', TEAMS_SIGNING_KEY);
        hmac.update(JSON.stringify(body));
        const expectedSignature = hmac.digest('base64');

        // Compare signatures
        return signature === expectedSignature;
    } catch (error) {
        console.error('Error validating Teams signature:', error);
        return false;
    }
}
