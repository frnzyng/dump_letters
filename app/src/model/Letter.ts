import { PublicKey } from "@solana/web3.js";

export interface Letter {
    sender: PublicKey; 
    timestamp: number;
    receiver: string;
    message: string;
    // Additional:
    created_ago: string;
    created_at: string;
}

