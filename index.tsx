import React, { useState, useCallback } from 'react';
import { useSDK, useAddress, ConnectWallet } from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import styles from '../styles/Home.module.css';
import Swal from 'sweetalert2';


interface ChainIdToExplorerUrl {
  [key: number]: string;
}

interface ChainIdToNetworkInfo {
  [key: number]: {
    name: string,
    currency: string,
  };
}

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

  const chainIdToNetworkInfo: ChainIdToNetworkInfo = {
    1: { name: 'Ethereum Mainnet', currency: 'ETH' },
    3: { name: 'Ropsten Testnet', currency: 'ETH' },
    4: { name: 'Rinkeby Testnet', currency: 'ETH' },
    5: { name: 'Goerli Testnet', currency: 'ETH' },
    42: { name: 'Kovan Testnet', currency: 'ETH' },
    137: { name: 'Polygon (Matic) Mainnet', currency: 'MATIC' },
    80001: { name: 'Mumbai Testnet', currency: 'MATIC' },
    100: { name: 'xDAI Chain', currency: 'DAI' },
    56: { name: 'Binance Smart Chain', currency: 'BNB' },
    250: { name: 'Fantom Opera', currency: 'FTM' },
    43114: { name: 'Avalanche C-Chain', currency: 'AVAX' },
    42161: { name: 'Arbitrum One', currency: 'ETH' },
  };

  const chainIdToExplorerUrl: ChainIdToExplorerUrl = {
    1: 'https://etherscan.io/tx/',
    3: 'https://ropsten.etherscan.io/tx/',
    4: 'https://rinkeby.etherscan.io/tx/',
    5: 'https://goerli.etherscan.io/tx/',
    42: 'https://kovan.etherscan.io/tx/',
    137: 'https://polygonscan.com/tx/',
    80001: 'https://mumbai.polygonscan.com/tx/',
    100: 'https://blockscout.com/poa/xdai/tx/',
    56: 'https://bscscan.com/tx/',
    250: 'https://ftmscan.com/tx/',
    43114: 'https://cchain.explorer.avax.network/tx/',
    42161: 'https://arbiscan.io/tx/',
  };

  const handleSend = useCallback(async () => {
    setIsLoading(true);
    setTransactionHash(null); // Reset the transaction hash

    // Get the signer from the SDK
    const signer = sdk?.getSigner();
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

    // Get network and construct explorer URL
    const network = await signer.provider.getNetwork();
    const networkInfo = chainIdToNetworkInfo[network.chainId] || { name: 'Unknown Network', currency: 'Unknown Currency' };
    const networkName = networkInfo.name;
    const networkCurrency = networkInfo.currency;


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
        html: `You are about to send <strong>${amount} ${networkCurrency}</strong> to <strong>${recipient}</strong> on <strong>${networkName}</strong>`,
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
      const explorerUrlBase = chainIdToExplorerUrl[network.chainId];
      const explorerUrl = explorerUrlBase ? `${explorerUrlBase}${txResponse.hash}` : '';

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdk, recipient, amount, isValidAmount, isValidRecipient]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Send EVM Funds</h1>
      <p className={styles.warning}>
        ⚠️ Please make sure you are on the network you wish to send funds on!
      </p>

      {address ? (
        <>
        <ConnectWallet className={styles.mainButton} />
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
          <button onClick={handleSend} className={styles.button} disabled={!isFormValid || isLoading}>
            {isLoading ? 'Sending...' : 'Send Funds'}
          </button>
        </>
      ) : (
        <ConnectWallet className={styles.button} />
      )}
    </div>
  );
}

export default App;