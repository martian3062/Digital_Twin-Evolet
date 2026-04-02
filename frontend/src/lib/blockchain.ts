/**
 * Blockchain Evidence Vault — Data Integrity Utility
 * Provides cryptographic hashing and transaction simulation for clinical data anchoring.
 */

/**
 * Computes a SHA-256 hash of the given string data using Web Crypto API.
 * This ensures data integrity by creating a unique fingerprint for each clinical summary.
 */
export async function computeHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Simulates anchoring the hash on a decentralized network (e.g., Polygon Amoy).
 * Returns a mock transaction hash and a verification link.
 */
export async function anchorToVault(clinicalHash: string) {
    // Artificial delay to simulate blockchain finality
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    return {
        success: true,
        transactionHash: txHash,
        explorerUrl: `https://amoy.polygonscan.com/tx/${txHash}`,
        timestamp: new Date().toISOString(),
        clinicalHash
    };
}
