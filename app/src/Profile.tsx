import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import { Buffer } from "buffer";
import { idl } from "./idl";
import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom';
import { Letter } from "./model/Letter";
import React from 'react';
import dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import '/Profile.css'

window.Buffer = Buffer;
const connection = new Connection(clusterApiUrl("devnet"), "processed");
const programId = new PublicKey("2fdSJQEFJppVTYX7KHfDm1aJo5bg75Yvwohcf4BKfE4G");

interface ProfilePageProps {
    walletKey: string | undefined;
}


const ProfilePage: React.FC<ProfilePageProps> = ({ walletKey }) => {
    const [provider, setProvider] = useState(undefined);
    const [publicKey, setPublicKey] = useState('');
    const [letters, setLetters] = useState<Letter[]>([]);


    useEffect(() => {
        const provider = getProvider();
        if (provider) setProvider(provider);
        else setProvider(undefined);

        connectWallet();
    }, []);

    useEffect(() => { 
        if (publicKey) {
            // Fetch letters and display content only when a wallet is connected
            fetchLetters();
        }
    }, [publicKey]);


    const getProvider = () => {
        if ("solana" in window) {
          const provider: any = window.solana;
          if (provider.isPhantom) return provider;
        }
    };

    const connectWallet = async () => {
        const { solana } = window as any;
    
        if (solana) {
          try {
            const response = await solana.connect();
            setPublicKey(response.publicKey.toString());
          } catch (err) {
            console.log();
          }
        }
      };
    

    async function fetchLetters() {
        if (provider) {
          try {
            const mainProvider = new AnchorProvider(connection, provider, {
              commitment: "processed",
            });
      
            const program = new Program(
              JSON.parse(JSON.stringify(idl)),
              programId,
              mainProvider
            );
      
            // Fetch all letter accounts from Solana blockchain:
            const letterAccounts = await program.account.letter.all();
            const lettersData: Letter[] = [];
      
            letterAccounts.forEach((account) => {
                // @ts-ignore
                const sender = account.account.sender;
                // @ts-ignore
                const timestamp = account.account.timestamp;
                // @ts-ignore
                const receiver = account.account.receiver;
                // @ts-ignore
                const message = account.account.message;
      
                // Check if the data structure matches the Letter interface
                if (sender && timestamp && receiver && message) {
        
                    // Format timestamp:
                    const created_ago = dayjs.unix(timestamp).fromNow();
                    const created_at = dayjs.unix(timestamp).format('MM/DD/YYYY hh:mm A');
        
                    // Store data in an array:
                    const letter: Letter = {
                    sender,
                    receiver,
                    timestamp,
                    created_ago,
                    created_at,
                    message,
                    };
                
                    lettersData.push(letter);
                } else {
                    console.error('Invalid data structure:', account);
                } 
            });
            
            setLetters(lettersData);
            console.log('Letters:', lettersData);
          } catch (error) {
            console.error("Error:", error);
          }
        }
      }    

    // Returns to the "Connect Wallet" page after disconnecting:
    if (!walletKey) {
        return <Navigate to="/" />;
    }


return (
    <div className='profile-block-container'>
      <div className='profile-content-container'>
        <div className='user-information'>
        <h2>User Profile</h2>
            {walletKey ? (
                <p>Public Key: {walletKey}</p>
            ) : (
                <p>No wallet connected</p>
            )}
        </div>

        <div className='user-letters'>
          <ul>
          {letters
              .filter((letter) => {
                  return (
                    letter.sender.toBase58().includes(publicKey)
                  );
              })
              .sort((a, b) => b.timestamp - a.timestamp).map((letterAccount, index) => (
              <div className='letter-content'>
                <li key={index}>
                  <div className='section1-letter'>
                    <p>From: {letterAccount.sender.toBase58()}</p>
                    <p>{letterAccount.created_ago}</p>
                  </div>
                  <div className='section2-letter'>
                    <p>To: {letterAccount.receiver}</p>
                    <p className='message'>{letterAccount.message}</p>
                  </div>    
                </li>
              </div>
              ))}
          </ul>
        </div>
      </div>
    </div>
  ); 
};
export default ProfilePage;
