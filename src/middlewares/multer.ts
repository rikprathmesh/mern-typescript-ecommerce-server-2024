import multer from 'multer'
import {v4 as uuid} from 'uuid'

// Returns middleware that processes a single file associated with the given form field.
// The Request object will be populated with a file object containing information about the processed file.
// multer().single("file")

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, "uploads")
    },
    filename(req, file, callback) {
        const id = uuid()

        const extName = file.originalname.split(".").pop()
        const fileName = `${id}.${extName}`
        callback(null, fileName)
    },
})

export const singleUpload = multer({storage}).single("photo")