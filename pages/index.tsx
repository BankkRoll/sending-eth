import React, { useState, useCallback } from 'react';
import { useSDK, useAddress, ConnectWallet } from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import styles from '../styles/Home.module.css';

function App() {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sdk = useSDK();
  const address = useAddress();

  // Form validation: check if the entered amount and recipient address are valid
  const isValidAmount = amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
  const isValidRecipient = ethers.utils.isAddress(recipient);
  const isFormValid = isValidAmount && isValidRecipient;

  const handleSendEth = useCallback(async () => {
    setIsLoading(true);
    // Check if the wallet is connected
    if (!sdk) {
      alert('Please connect your wallet first.');
      setIsLoading(false);
      return;
    }
    // Validate the recipient address
    if (!isValidRecipient) {
      alert('Please enter a valid recipient address.');
      setIsLoading(false);
      return;
    }
    // Validate the amount to send
    if (!isValidAmount) {
      alert('Please enter a valid amount.');
      setIsLoading(false);
      return;
    }
    try {
      // Convert the amount from ETH to wei
      const valueInWei = ethers.utils.parseEther(amount);
      // Construct the transaction object
      const tx = {
        to: recipient,
        value: valueInWei,
      };
      // Get the signer from the SDK
      const signer = sdk.getSigner();
      if (!signer) {
        alert('Signer not available.');
        setIsLoading(false);
        return;
      }

      // Send the transaction and wait for the response
      const txResponse = await signer.sendTransaction(tx);
      await txResponse.wait();
      alert('Transaction successful!');
      setAmount('');
      setRecipient('');
    } catch (error) {
      alert('Transaction failed: ' + error);
    }
    setIsLoading(false);
  }, [sdk, recipient, amount, isValidAmount, isValidRecipient]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Send ETH</h1>
      {address ? (
        <>
          <input
            type="text"
            placeholder="Recipient Address (e.g., 0x123...)"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Amount (ETH)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.input}
          />
          <button onClick={handleSendEth} className={styles.button} disabled={!isFormValid || isLoading}>
            {isLoading ? 'Sending...' : 'Send ETH'}
          </button>
        </>
      ) : (
        <ConnectWallet className={styles.button} />
      )}
    </div>
  );
}

export default App;
