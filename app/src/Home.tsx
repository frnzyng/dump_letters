import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor';
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
import '/Home.css'

window.Buffer = Buffer;
const connection = new Connection(clusterApiUrl("devnet"), "processed");
const keyPair = web3.Keypair.generate();
const programId = new PublicKey("2fdSJQEFJppVTYX7KHfDm1aJo5bg75Yvwohcf4BKfE4G");

interface HomePageProps {
    walletKey: string | undefined;
}


const HomePage: React.FC<HomePageProps> = ({ walletKey }) => {
    const [provider, setProvider] = useState(undefined);
    const [publicKey, setPublicKey] = useState('');  
    const [to, setTo] = useState('');
    const [message, setMessage] = useState('');
    const [letters, setLetters] = useState<Letter[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [textAreaInput, setTextAreaInput] = useState('');

    const inputMaxLength = 20;
    const textareaMaxLength = 280;
    

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

    // Toggle form visibility:
    const showForm = () => {
      setIsVisible(true);
    };

    const hideForm = () => {
      setIsVisible(false);
    }

    const handleTextInput = (event: { target: { value: any; }; }) => {
      const inputValue = event.target.value;
      if (inputValue.length <= inputMaxLength) {
        setTo(inputValue);
        setTextInput(inputValue);
      }
    };
  
    const handleTextArea = (event: { target: { value: any; }; }) => {
      const inputValue = event.target.value;
      if (inputValue.length <= textareaMaxLength) {
        setMessage(inputValue);
        setTextAreaInput(inputValue);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        // Prevents page referesh
        e.preventDefault();
    
        if (provider) {
            try {
            // Initialize the Anchor provider
            const mainProvider = new AnchorProvider(connection, provider, {
                commitment: "processed",
            });
        
            const program = new Program(
                JSON.parse(JSON.stringify(idl)),
                programId,
                mainProvider
            );
        
            await program.methods.sendLetter(to, message) 
                .accounts({
                  letter: keyPair.publicKey,
                  user: mainProvider.publicKey,
                  systemProgram: web3.SystemProgram.programId,
                })
                .signers([keyPair])
                .rpc();

                hideForm();
            } catch (error) {
            console.error("Error:", error);
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
    <div className='home-block-container'>
      <div className='home-content-container'> 
        {isVisible && (
          <div className='create-letter-container'>
            <h2>Create Letter</h2>
            <div className='form-container'>
              <form onSubmit={handleSubmit}>
                    <div className='input1-container'>
                      <div className='input1'>
                        <label>To:</label>
                        <input className='receiver-input' type="text" placeholder="Enter name" value={to} onChange={handleTextInput}/>
                      </div>
                      <p className='character-count'>{textInput.length}/{inputMaxLength}</p>
                    </div>
                    <div className='input2-container'>
                      <textarea className='message-input' placeholder="Enter message" value={message} onChange={handleTextArea}/>
                      <p className='character-count'>{textAreaInput.length}/{textareaMaxLength}</p>
                    </div>
                    <div className='button-container'>
                      <button className='cancel-button' onClick={hideForm}>Cancel</button>
                      <button type='submit' className='submit-button'>Submit</button>
                    </div>
              </form>
            </div>
          </div>
        )}

        {!isVisible && (   
          <div className='mailbox-container'>
            <div className='header-container'>
              <h2>Mailbox</h2>
              <button className='create-letter-button' id='create-letter-button' onClick={showForm}>Create Letter</button>
            </div>
            
            <ul>
            {letters.sort((a, b) => b.timestamp - a.timestamp).map((letter, index) => (
              <div className='letter-content'>
                <li key={index}>
                  <div className='section1-letter'>
                    <p>From: {letter.sender.toBase58()}</p>
                    <p>{letter.created_ago}</p>
                  </div>
                  <div className='section2-letter'>
                    <p>To: {letter.receiver}</p>
                    <p className='message'>{letter.message}</p>
                  </div>    
                </li>
              </div>
            ))}
            </ul>
          </div>
        )}
      </div>   
    </div>
  );
};
export default HomePage;
