import React from 'react';

interface ConnectButtonProps {
  onConnect: () => void;
  connected: boolean;
}

const ConnectButton: React.FC<ConnectButtonProps> = ({ onConnect, connected }) => {
  return (
    <button onClick={onConnect} className='connection-button'>
      {connected ? "Disconnect Wallet" : "Connect Phantom Wallet"}
    </button>
  );
}

export default ConnectButton;
