import React, { useState, useCallback } from 'react';
import { useSDK, useAddress, ConnectWallet } from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import styles from '../styles/Home.module.css';
import Swal from 'sweetalert2';

function App() {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const sdk = useSDK();
  const address = useAddress();

  // Form validation: check if the entered amount and recipient address are valid
  const isValidAmount = amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
  const isValidRecipient = ethers.utils.isAddress(recipient);
  const isFormValid = isValidAmount && isValidRecipient;

  const handleSendEth = useCallback(async () => {
    setIsLoading(true);
    setTransactionHash(null); // Reset the transaction hash
  
    // Check if the wallet is connected
    if (!sdk) {
      Swal.fire('Error', 'Please connect your wallet first.', 'error');
      setIsLoading(false);
      return;
    }
    // Validate the recipient address
    if (!isValidRecipient) {
      Swal.fire('Error', 'Please enter a valid recipient address.', 'error');
      setIsLoading(false);
      return;
    }
    // Validate the amount to send
    if (!isValidAmount) {
      Swal.fire('Error', 'Please enter a valid amount.', 'error');
      setIsLoading(false);
      return;
    }
    try {
      // Confirm transaction
      const willSend = await Swal.fire({
        title: 'Are you sure?',
        html: `You are about to send <strong>${amount}</strong> ETH to <strong>${recipient}</strong>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, send it!'
      });
  
      if (willSend.isConfirmed) {
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
          Swal.fire('Error', 'Signer not available.', 'error');
          setIsLoading(false);
          return;
        }

        // Ensure that the signer has a provider
        if (!signer.provider) {
          Swal.fire('Error', 'Provider not available.', 'error');
          setIsLoading(false);
          return;
        }

  
        // Send the transaction and wait for the response
        const txResponse = await signer.sendTransaction(tx);
        await txResponse.wait();
        setTransactionHash(txResponse.hash); // Store the transaction hash
  
        // Get network and construct explorer URL
        const network = await signer.provider.getNetwork();
        let explorerUrl;
        switch (network.chainId) {
          case 1: // Ethereum Mainnet
            explorerUrl = `https://etherscan.io/tx/${txResponse.hash}`;
            break;
          case 3: // Ropsten Testnet
            explorerUrl = `https://ropsten.etherscan.io/tx/${txResponse.hash}`;
            break;
          case 4: // Rinkeby Testnet
            explorerUrl = `https://rinkeby.etherscan.io/tx/${txResponse.hash}`;
            break;
          case 5: // Goerli Testnet
            explorerUrl = `https://goerli.etherscan.io/tx/${txResponse.hash}`;
            break;
          case 42: // Kovan Testnet
            explorerUrl = `https://kovan.etherscan.io/tx/${txResponse.hash}`;
            break;
          case 80001: // Mumbai Testnet
            explorerUrl = `https://mumbai.polygonscan.com/tx/${txResponse.hash}`;
            break;
          default: // Unknown network
            explorerUrl = '';
        }
  
        Swal.fire({
          title: 'Success',
          html: `Transaction successful! You can view your transaction <a href="${explorerUrl}" target="_blank">here</a>.`,
          icon: 'success'
        });
        setAmount('');
        setRecipient('');
      }
    } catch (error) {
      Swal.fire('Error', 'Transaction failed: ' + error, 'error');
    }
    setIsLoading(false);
  }, [sdk, recipient, amount, isValidAmount, isValidRecipient]);
  

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Send ETH</h1>
      <p className={styles.warning}>
        ⚠️ Please make sure you are on the network you wish to send funds on!
      </p>

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
