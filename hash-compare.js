#!/usr/bin/env node

const fetch = require('fetch-base64');

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
	portionInstance.methods.getById(id)
		.call({ from: process.env.ADMIN_ADDRESS })
		.then((result) => {
			if (result && result[0] && !result[0].documents.length) {
				console.warn('No documents found');
				process.exit();
			}
			if (result && result[0]) {
				result[0].hashes.forEach((hash, index, hashes) => {
					fetch.remote(
						`https://psab-documents225914-dev.s3.amazonaws.com/public/${web3.utils.toUtf8(result[0].documents[index])}`)
					.then((data) => {
						console.log(`Document ${index} hash: ${web3.utils.keccak256(data[1]) === hash}`);
						if (index === hashes.length - 1) {
							process.exit();
						}
					}).catch((reason) => {
						console.error(reason);
						process.exit(-1);
					});
				});
			}
		})
		.catch((error) => {
			console.error(error.message);
			process.exit(-1);
		});
} catch(error) {
	console.error(error);
	process.exit(-1);
}
