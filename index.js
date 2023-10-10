require('dotenv').config();
const axios = require('axios').default;
const { ethers } = require('ethers');
const PRICE_TO_BUY = 1.21;
const PROFITABILITY = 1.694;//40%
const USDC = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d';
const CAKE = '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82';
const USDT_TESTNET = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d';
const CAKE_TESTNET = '0x8d008B313C1d6C7fE2982F62d32Da7507cF43551';
const WBNB_TESTNET = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';

//0x8d008B313C1d6C7fE2982F62d32Da7507cF435510x8d008B313C1d6C7fE2982F62d32Da7507cF43551

function getWallet () {
    const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
    const wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC);
    return wallet.connect(provider);
}

function approve(wallet, tokenToApprove, value){
    const contract = new ethers.Contract(
        tokenToApprove,
        ["function approve(address _spender, uint256 _value) public returns (bool success)"],
        wallet
    );

    return contract.approve(process.env.ROUTER_CONTRACT, value);
}

async function swapTokens(tokenFrom, quantity, tokenTo) {
    const wallet = getWallet();
    const contract = new ethers.Contract(
        process.env.ROUTER_CONTRACT,
        ["function swapExactTokensForTokens( uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"],
        wallet
    );
    const value = ethers.parseEther(quantity).toString();

    await approve(wallet, tokenFrom, value);

    const result = await contract.swapExactTokensForTokens(
        value,
        0,
        [tokenFrom, WBNB_TESTNET, tokenTo],
        process.env.WALLET,
        Date.now() + 10000,
        {
            gasPrice: 10000000000,
            gasLimit: 250000
        }
       )
    
        
        console.log(result);   

}

const headers = "0x-api-key: <api-key"

let isOpened = false;

setInterval(async () => {

    const response = await axios.get(`https://bsc.api.0x.org/swap/v1/price?sellToken=${CAKE}&sellAmount=1000000000000000000&buyToken=${USDC}`, {headers});
    const cakePrice = parseFloat(response.data.price); 
    console.log("Cake Price: ", cakePrice);
    
    if (cakePrice < PRICE_TO_BUY && !isOpened) {
      console.log('Hora de COMPRA!!.');
      swapTokens(USDC, "2", CAKE);
      isOpened = true;
    }
    else if (cakePrice > (PRICE_TO_BUY * PROFITABILITY) && isOpened) {
      console.log('Hora de VENDER!!.');
      swapTokens(CAKE, "5", USDC);
      isOpened = false;
    }
    
}, 3000)

