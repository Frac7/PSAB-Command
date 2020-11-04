#!/usr/bin/env node

const fetch = require('fetch-base64');

const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');

const LAND = 'Land';
const PORTION = 'Portion';

// args must contain the element and the id
const [,, ... [ element, id ]] = process.argv;

if (element !== LAND && element !== PORTION) {
	console.error('Invalid element');
	process.exit(-1);
}

const { abi } = require(`./ABI/${element}.json`);
const address = element === LAND ? process.env.LAND_ADDRESS : process.env.PORTION_ADDRESS;

if (isNaN(parseInt(id)) || parseInt(id) < 0) {
	console.error('Invalid portion ID');
	process.exit(-1);
}

const web3 = new Web3(process.env.TESTNET_ENDPOINT);

// function that, for each hash found, retrieve the relative document and calculate its hash to compare it to the previous one
const hashCompare = (documents) => (hash, index, hashes) => {
	fetch.remote(
		`https://psab-documents225914-dev.s3.amazonaws.com/public/${web3.utils.toUtf8(documents[index])}`)
		.then((data) => {
			console.log(`Document ${index} hash: ${web3.utils.keccak256(data[1]) === hash}`);
			if (index === hashes.length - 1) {
				process.exit();
			}
		}).catch((reason) => {
		console.error(reason);
		process.exit(-1);
	})
}

// specific land check
const handleLandCheck = (result) => {
	if (result && !result.documents.length) {
		console.warn('No documents found');
		process.exit();
	}
	if (result) {
		result.hashes.forEach(hashCompare(result.documents));
	}

}

// specific portion check
const handlePortionCheck = (result) => {
	if (result && result[0] && !result[0].documents.length) {
		console.warn('No documents found');
		process.exit();
	}
	if (result && result[0]) {
		result[0].hashes.forEach(hashCompare(result[0].documents));
	}
}

try {
	// create web3 provider using infura and goerli testnet
	const provider = new HDWalletProvider({
		mnemonic: process.env.TEST_SEED_PHRASE,
		providerOrUrl: process.env.TESTNET_ENDPOINT,
		shareNonce: false
	});

	web3.setProvider(provider);

	// create contract instance
	const instance = new web3.eth.Contract(abi, address);
	instance.methods.getById(id)
		.call({ from: process.env.ADMIN_ADDRESS })
		.then((result) => {
			if (element === LAND) {
				handleLandCheck(result);
			} else {
				handlePortionCheck(result);
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
