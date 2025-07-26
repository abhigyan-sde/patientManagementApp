const { ipcMain, app } = require('electron');
const fs = require('fs/promises');
const path = require('path');
const { Layer } = require('../shared/constants');
const { getFunctionName } = require('../shared/util');
const { wrapAppError } = require('../shared/errorHandler');

let workspacePath = path.join(app.getPath('userData'), 'prescriptions');

module.exports = function setUpFileHandlers() {

    ipcMain.handle('set-workspace-path', (event, newPath) => {
        try {
            workspacePath = newPath;
        } catch (error) {
            throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Error occurred in ipc set-workspace-path handler.');
        }

    });

    ipcMain.handle('save-prescription-file', async (event, data) => {
        try {
            const filePath = path.join(data.folderPath, data.fileName);
            const buffer = Buffer.from(data.fileDataBase64, 'base64');
            await fs.writeFile(filePath, buffer);
            console.log('Prescription saved at : ' + filePath);
            return filePath; // Return full path to store in DB
        } catch (error) {
            throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Error occurred in ipc save-prescription-file handler.');
        }
    });

    ipcMain.handle('create-prescription-folder', async (event, folderTimestamp) => {
        try {
            const folderPath = path.join(workspacePath, `prescriptions-${folderTimestamp}`);
            await fs.mkdir(folderPath, { recursive: true });
            return folderPath;
        } catch (error) {
            throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Error occurred in ipc create-prescription-folder handler.');
        }
    });

    ipcMain.handle('delete-folder', async (event, folderPath) => {
        try {
            await fs.rm(folderPath, { recursive: true, force: true });
        } catch (error) {
            throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Failed to delete prescription folder : ' + folderPath);
        }
    });

    ipcMain.handle('get-prescription-images', async (event, folderPath) => {
        try {
            const files = await fs.readdir(folderPath);
            let res = files
                .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
                .map(f => path.join(folderPath, f));
            console.log('Folder path : ' + folderPath);
            console.log("Result : " + res);
            return res;
        } catch (error) {
            throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Failed to read images in prescription folder : ' + folderPath);
        }
    });

    ipcMain.handle('load-image-folder-base64', async (event, folderPath) => {
        try {
            const files = await fs.readdir(folderPath);
            const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

            const base64Images = await Promise.all(
                imageFiles.map(async filename => {
                    const fullPath = path.join(folderPath, filename);
                    const ext = path.extname(filename).slice(1); // 'png', 'jpg', etc.
                    const buffer = await fs.readFile(fullPath);
                    return {
                        path: fullPath,
                        preview: `data:image/${ext};base64,${buffer.toString('base64')}`,
                    };
                })
            );

            return base64Images; // ✅ Return type: { path: string; preview: string }[]
        } catch (error) {
            console.error('Error loading image:', folderPath, error);
            throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Failed to read images at: ' + folderPath);
        }
    });

    ipcMain.handle('delete-prescription-file', async (event, imagePath) => {
        try {
            await fs.unlink(imagePath);
        } catch (error) {
            console.error('Error deleting image at :', imagePath, error);
            throw wrapAppError(error, Layer.HANDLER, getFunctionName(), 'Failed to delete image at : ' + imagePath);
        }
    });
}