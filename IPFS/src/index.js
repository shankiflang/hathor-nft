const fs = require('fs')
const axios = require('axios')
const { FormData, File } = require('formdata-node')
const { FormDataEncoder } = require('form-data-encoder')
const { Readable } = require('stream')

const options = {
    endpoints: {
        mkdir: `http://127.0.0.1:5001/api/v0/files/mkdir`,
        add: `http://127.0.0.1:5001/api/v0/files/write`,
        flush: `http://127.0.0.1:5001/api/v0/files/flush`,
    },
    imagesFolder: 'build/images',
    jsonFolder: 'build/json',
    baseIPFSFolderName: 'NFTotter',
    gammeNFT: 'LilOtters',
}

try {
    // FOLDER CHECK
    console.log(' ')

    if (fs.existsSync(options.imagesFolder)) console.log('Images folder ok ✔')
    else throw 'No images folder'

    if (fs.existsSync(options.jsonFolder)) console.log('JSON folder ok ✔')
    else throw 'No JSONs folder'

    console.log(' ')
    console.log(' ')
    console.log(' ')

    axios.post(`${options.endpoints.mkdir}?arg=/${options.baseIPFSFolderName}/${options.gammeNFT}`)
    console.log('Gamme folder created ✔')

    console.log(' ')
    console.log(' ')
    console.log(' ')

    let images = fs.readdirSync(options.imagesFolder)

    images.forEach(async (value, index) => {
        let name = value.split('.')[0]
        let jsonPath = `./${options.jsonFolder}/${name}.json`
        let imagePath = `./${options.imagesFolder}/${value}`

        // Folders creation
        let res1 = await axios.post(
            `${options.endpoints.mkdir}?arg=/${options.baseIPFSFolderName}/${options.gammeNFT}/${name}`,
        )

        if (res1.status === 200) console.log(`Folder ${name} created ✔`)
        else throw `Folder ${name} error`

        // Push image
        const imageForm = new FormData()
        const imageFile = new File([fs.readFileSync(imagePath)], value)
        imageForm.set('data', imageFile)
        const imageEncoder = new FormDataEncoder(imageForm)

        let imageRes = await axios.post(
            `${options.endpoints.add}?arg=/${options.baseIPFSFolderName}/${options.gammeNFT}/${name}/${value}&create=true`,
            Readable.from(imageEncoder),
            {
                headers: {
                    ...imageEncoder.headers,
                },
            },
        )

        if (imageRes.status === 200) console.log(`File ${name} created ✔`)
        else throw `File ${name} error`

        // Retrieve CID
        let imageCID = await axios
            .post(
                `${options.endpoints.flush}?arg=/${options.baseIPFSFolderName}/${options.gammeNFT}/${name}/${value}`,
            )
            .then((response) => response.data)
            .catch((error) => {
                throw error
            })

        let fullJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

        // Add CID to JSON
        let realJson = {
            name: fullJson.name,
            description: fullJson.description,
            file: `ipfs://ipfs/${imageCID.Cid}`,
            attributes: fullJson.attributes,
        }

        fs.writeFile(jsonPath, JSON.stringify(realJson, null, 2), 'utf8', function (err) {
            if (err) throw err
        })

        // Push JSON
        const jsonForm = new FormData()
        const jsonFile = new File([JSON.stringify(realJson, null, 2)], `${name}.json`)
        jsonForm.set('data', jsonFile)
        const jsonEncoder = new FormDataEncoder(jsonForm)

        let jsonRes = await axios.post(
            `${options.endpoints.add}?arg=/${options.baseIPFSFolderName}/${options.gammeNFT}/${name}/${name}.json&create=true`,
            Readable.from(jsonEncoder),
            {
                headers: {
                    ...jsonEncoder.headers,
                },
            },
        )

        if (jsonRes.status === 200) console.log(`File ${name} created ✔`)
        else throw `File ${name} error`
    })
} catch (e) {
    console.log(e)
}
