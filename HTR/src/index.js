const axios = require('axios')

const options = {
    endpoints: {
        ls: `http://127.0.0.1:5001/api/v0/files/ls`,
        flush: `http://127.0.0.1:5001/api/v0/files/flush`,
        read: `http://127.0.0.1:5001/api/v0/files/read`,
        createNFT: `http://localhost:8000/wallet/create-nft`,
    },
    htrWallet: 'WVxtUu4gq8JTpxyYZrt9wFNnRhfqrdfaPW',
    baseIPFSFolderName: 'NFTotter',
    gammeNFT: 'LilOtters',
    symbol: 'LO',
}

const asyncForEach = async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

async function main() {
    // Get all folders
    let { data: folders } = await axios.post(
        `${options.endpoints.ls}?arg=/${options.baseIPFSFolderName}/${options.gammeNFT}`,
    )

    asyncForEach(folders.Entries, async (value, index) => {
        console.log(`Starting process ${value.Name}`)
        
        const id = value.Name
        
        // Get JSON Cid
        const { data: jsonCID } = await axios.post(
            `${options.endpoints.flush}?arg=/${options.baseIPFSFolderName}/${options.gammeNFT}/${id}/${id}.json`,
        )

        // Get Nft Datas
        const { data: nftData } = await axios.post(
            `${options.endpoints.read}?arg=/${options.baseIPFSFolderName}/${options.gammeNFT}/${id}/${id}.json`,
        )

        // Add datas to params
        const params = new URLSearchParams()
        params.append('name', nftData.name)
        params.append('symbol', `${options.symbol}${id}`)
        params.append('amount', 1)
        params.append('data', `ipfs://ipfs/${jsonCID.Cid}`)
        params.append('address', options.htrWallet)

        // For each json, push nft to htrWallet
        await axios.post(options.endpoints.createNFT, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Wallet-Id': '123',
            },
        })

        console.log(`Token ${nftData.name} sent to ${options.htrWallet}`)
    })
}

main()
