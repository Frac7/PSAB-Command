#!/usr/bin/env node

const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');

const { abi } = require('./ABI/Portion.json');

// args must contain the portion id
const [,, ... id] = process.argv;

if (isNaN(parseInt(id))) {
	console.error('Invalid portion ID');
	process.exit(-1);
}

const web3 = new Web3(process.env.TESTNET_ENDPOINT);

try {
	// create web3 provider using infura and goerli testnet
	const provider = new HDWalletProvider({
		mnemonic: process.env.TEST_SEED_PHRASE,
		providerOrUrl: process.env.TESTNET_ENDPOINT,
		shareNonce: false
	});

	web3.setProvider(provider);

	// create contract instance
	const portionInstance = new web3.eth.Contract(abi, process.env.PORTION_ADDRESS);
	portionInstance.methods.ownershipExpiration(id)
		.send({ from: process.env.ADMIN_ADDRESS })
		.then((result) => {
			console.log(result);
			process.exit();
		})
		.catch((error) => {
			console.error(error.message);
			process.exit();
		});
} catch(error) {
	console.error(error);
	process.exit(-1);
}
