import { useState, useEffect} from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons/faEnvelope';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import HomePage from '/src/Home';
import SearchPage from '/Search';
import ProfilePage from '/Profile';
import '/App.css'

function App() {
  const [provider, setProvider] = useState(undefined);
  const [walletKey, setWalletKey] = useState(undefined);
  const [showDownloadMessage, setShowDownloadMessage] = useState(false);


  // Get provider on load
  useEffect(() => {
    const provider = getProvider();
    if (provider) {
      setProvider(provider);
    }
    else {
      setProvider(undefined);
      setShowDownloadMessage(true);
    }

    //connectWallet();
  }, []);


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
        setWalletKey(response.publicKey.toString());

        console.log("Connected Wallet: ", response.publicKey.toString());
        console.log(provider);
      } catch (err) {
        console.log();
      }
    }
  };

  const disconnectWallet = async () => {
    const { solana } = window as any;

    if (walletKey && solana) {
      await solana.disconnect();
      setWalletKey(undefined);

      return <Navigate to="/" />;
    }
  };


  return (
  <>
  <div className='block-container'>

    <Router>
      <div className='app-block-container'>

        {walletKey ? (
            <div className='nav-bar'>
              <div className='link-container'>
                <div className='link1-container'>
                  <FontAwesomeIcon className='envelope-icon' icon={faEnvelope} />
                  <Link to="/" className='mailbox-link'>Mailbox</Link>
                </div>
                <div className='link2-container'>
                  <FontAwesomeIcon className='search-icon' icon={faMagnifyingGlass} />
                  <Link to="/search" className='search-link'>Search</Link>
                </div>
                <div className='link3-container'>
                  <FontAwesomeIcon className='profile-icon' icon={faUser} />
                  <Link to="/profile" className='profile-link'>Profile</Link>
                </div>
                <div className='link4-container'>
                <FontAwesomeIcon className='disconnect-icon' icon={faArrowLeft} />
                <button className='disconnect-button' onClick={disconnectWallet}>Disconnect Wallet</button>
                </div>
              </div>
            </div>
          ) : (
            <div className='app-content'>
              <img src='/src/assets/dump-letters-icon.png' className="hero-icon" alt='dump-letters-icon' />
              <h1>Dump_Letters</h1>
              <p className='description'>A place to anonymously dump your message to someone or anyone.</p>
              <button className="connect-button" onClick={connectWallet}>Connect Phantom Wallet</button>
              {showDownloadMessage && (
                  <a href='https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa' className='download-message'>No Phantom Wallet?</a>
              )}
            </div>
          )}
          
        <Routes>
          {/* Checks if a wallet is connected, prompts user to the home page if true */}
          {walletKey ? (
            <Route path="/" element={<HomePage walletKey={walletKey} />}/>
          ) : 
          <Route path="/" />
          }
          {/* Routes for other pages */}
          <Route path="/search" element={<SearchPage walletKey={walletKey} />} />
          <Route path="/profile" element={<ProfilePage walletKey={walletKey} />} />
        </Routes>
      </div>
    </Router>

  </div>
    
  </>);
}
export default App
