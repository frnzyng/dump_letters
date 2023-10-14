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
import './Search.css'

window.Buffer = Buffer;
const connection = new Connection(clusterApiUrl("devnet"), "processed");
const programId = new PublicKey("2fdSJQEFJppVTYX7KHfDm1aJo5bg75Yvwohcf4BKfE4G");

interface SearchPageProps {
    walletKey: string | undefined;
}


const SearchPage: React.FC<SearchPageProps> = ({ walletKey }) => {
    const [provider, setProvider] = useState(undefined);
    const [searchInput, setSearchInput] = useState('');
    const [letters, setLetters] = useState<Letter[]>([]);
    

    useEffect(() => {
        const provider = getProvider();
        if (provider) setProvider(provider);
        else setProvider(undefined);
    }, []);


    const getProvider = () => {
        if ("solana" in window) {
          const provider: any = window.solana;
          if (provider.isPhantom) return provider;
        }
    };
    
    
    async function searchLetters(e: React.FormEvent) {
        // Prevents page referesh
        e.preventDefault()
        
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
    <div className='search-block-container'>
      <div className='search-content-container'>
        <div className='searchbar-container'>
          <h2>Search Letters</h2>
          <form onSubmit={searchLetters}>
            <div className='input-container'>
              <input className='search-input' type="text" placeholder="Enter keyword" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}/>
              <button type="submit" className='submit-button'>Search</button>
            </div>
          </form>
        </div>

        <div className='search-result-container'>
          <ul>
          {letters
            .filter((letter) => {
                const searchInputLower = searchInput.toLowerCase();
                return (
                  letter.receiver.toLowerCase().includes(searchInputLower) ||
                  letter.sender.toBase58().includes(searchInput) || 
                  letter.created_ago.toString().includes(searchInputLower) ||
                  letter.message.toLowerCase().includes(searchInputLower)
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
export default SearchPage;