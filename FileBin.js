/**
 * ## FileBin
 * A little library for dealing with file objects
 *
 * Best to use the methods directoryOpen(), fileOpen(), and fileSave()
 * as these methods ensure the use of the File System Access API is used
 * either the latest version or the legacy one.
 *
 * If the File System Access API isn't supported by the client's browser
 * it will then fallback to using the old-school hacks for opening and
 * saving files and directories.
 */
const handler = new function FileBin () {
    let self = this;

    /**
     * Returns whether the File System Access API is supported and usable in the
     * current context (for example cross-origin iframes).
     * @returns {boolean} Returns `true` if the File System Access API is supported and usable, else returns `false`.
     */
    const supported = (() => {
        if ('top' in self && self !== top) {
            try {
                // This will succeed on same-origin iframes,
                // but fail on cross-origin iframes.
                top.location + '';
            } catch {
                return false;
            }
        } else if ('chooseFileSystemEntries' in self) {
            return 'chooseFileSystemEntries';
        } else if ('showOpenFilePicker' in self) {
            return 'showOpenFilePicker';
        }
        return false;
    })();

    FileBin.prototype.getFiles = async (dirHandle, recursive, path = dirHandle.name) => {
        const dirs = [];
        const files = [];
        for await (const entry of dirHandle.values()) {
            const nestedPath = `${path}/${entry.name}`;
            if (entry.kind === 'file') {
                files.push(
                    entry.getFile().then((file) => {
                        file.directoryHandle = dirHandle;
                        return Object.defineProperty(file, 'webkitRelativePath', {
                            configurable: true,
                            enumerable: true,
                            get: () => nestedPath,
                        });
                    })
                );
            } else if (entry.kind === 'directory' && recursive) {
                dirs.push(self.getFiles(entry, recursive, nestedPath));
            }
        }
        return [...(await Promise.all(dirs)).flat(), ...(await Promise.all(files))];
    };

    FileBin.prototype.getFilesLegacy = async (dirHandle, recursive, path = dirHandle.name) => {
        const dirs = [];
        const files = [];
        for await (const entry of dirHandle.getEntries()) {
            const nestedPath = `${path}/${entry.name}`;
            if (entry.isFile) {
                files.push(
                    entry.getFile().then((file) => {
                        file.directoryHandle = dirHandle;
                        return Object.defineProperty(file, 'webkitRelativePath', {
                            configurable: true,
                            enumerable: true,
                            get: () => nestedPath,
                        });
                    })
                );
            } else if (entry.isDirectory && recursive) {
                dirs.push(self.getFilesLegacy(entry, recursive, nestedPath));
            }
        }
        return [...(await Promise.all(dirs)).flat(), ...(await Promise.all(files))];
    };

    /**
     * Opens a directory from disk using the (legacy) File System Access API.
     */
    FileBin.prototype.openDirLegacy = async (options = {}) => {
        options.recursive = options.recursive || false;
        const handle = await window.chooseFileSystemEntries({
            type: 'open-directory',
        });
        return self.getFilesLegacy(handle, options.recursive);
    };

    /**
     * Opens a directory from disk using the File System Access API.
     */
    FileBin.prototype.openDir = async (options = {}) => {
        options.recursive = options.recursive || false;
        const handle = await window.showDirectoryPicker();
        return self.getFiles(handle, options.recursive);
    };

    FileBin.prototype.getFileWithHandle = async (handle) => {
        const file = await handle.getFile();
        file.handle = handle;
        return file;
    };

    /**
     * Opens a file from disk using the (legacy) File System Access API.
     */
    FileBin.prototype.openFileLegacy = async (options = {}) => {
        const handleOrHandles = await window.chooseFileSystemEntries({
            accepts: [
                {
                    description: options.description || '',
                    mimeTypes: options.mimeTypes || ['*/*'],
                    extensions: options.extensions || [''],
                },
            ],
            multiple: options.multiple || false,
        });
        if (options.multiple) {
            return Promise.all(handleOrHandles.map(self.getFileWithHandle));
        }
        return self.getFileWithHandle(handleOrHandles);
    };

    /**
     * Opens a file from disk using the File System Access API.
     */
    FileBin.prototype.openFile = async (options = {}) => {
        const accept = {};
        if (options.mimeTypes) {
            options.mimeTypes.map((mimeType) => {
                accept[mimeType] = options.extensions || [];
            });
        } else {
            accept['*/*'] = options.extensions || [];
        }
        const handleOrHandles = await window.showOpenFilePicker({
            types: [
                {
                    description: options.description || '',
                    accept: accept,
                },
            ],
            multiple: options.multiple || false,
        });
        const files = await Promise.all(handleOrHandles.map(self.getFileWithHandle));
        if (options.multiple) {
            return files;
        }
        return files[0];
    };

    /**
     * Saves a file to disk using the (legacy) File System Access API.
     */
    FileBin.prototype.saveFileLegacy = async (blob, options = {}, handle = null) => {
        options.fileName = options.fileName || 'Untitled';
        handle =
            handle ||
            (await window.chooseFileSystemEntries({
                type: 'save-file',
                accepts: [
                    {
                        description: options.description || '',
                        mimeTypes: [blob.type],
                        extensions: options.extensions || [''],
                    },
                ],
            }));
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return handle;
    };

    /**
     * Saves a file to disk using the File System Access API.
     */
    FileBin.prototype.saveFile =  async (
        blob,
        options = {},
        existingHandle = null,
        throwIfExistingHandleNotGood = false
    ) => {
        options.fileName = options.fileName || 'Untitled';
        const accept = {};
        if (options.mimeTypes) {
            options.mimeTypes.push(blob.type);
            options.mimeTypes.map((mimeType) => {
                accept[mimeType] = options.extensions || [];
            });
        } else {
            accept[blob.type] = options.extensions || [];
        }
        if (existingHandle) {
            try {
                // Check if the file still exists.
                await existingHandle.getFile();
            } catch (err) {
                existingHandle = null;
                if (throwIfExistingHandleNotGood) {
                    throw err;
                }
            }
        }
        const handle =
            existingHandle ||
            (await window.showSaveFilePicker({
                suggestedName: options.fileName,
                types: [
                    {
                        description: options.description || '',
                        accept: accept,
                    },
                ],
            }));
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return handle;
    };

    /**
     * Saves a file to disk using the legacy hidden anchor method.
     */
    FileBin.prototype.legacySave = async (blob, options = {}) => {
        const a = document.createElement('a');
        a.download = options.fileName || 'Untitled';
        a.href = URL.createObjectURL(blob);
        a.addEventListener('click', () => {
            // `setTimeout()` due to
            // https://github.com/LLK/scratch-gui/issues/1783#issuecomment-426286393
            setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
        });
        a.click();
    };

    /**
     * Opens a file from disk using the legacy input click method.
     */
    FileBin.prototype.legacyOpen = async (options = {}) => {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            const accept = [
                ...(options.mimeTypes ? options.mimeTypes : []),
                options.extensions ? options.extensions : [],
            ].join();
            input.multiple = options.multiple || false;
            // Empty string allows everything.
            input.accept = accept || '';

            let cleanupListenersAndMaybeReject;
            const rejectionHandler = () => cleanupListenersAndMaybeReject(reject);
            if (options.setupLegacyCleanupAndRejection) {
                cleanupListenersAndMaybeReject =
                    options.setupLegacyCleanupAndRejection(rejectionHandler);
            } else {
                // Default rejection behavior; works in most cases, but not in Chrome in non-secure contexts.
                cleanupListenersAndMaybeReject = (reject) => {
                    window.removeEventListener('pointermove', rejectionHandler);
                    window.removeEventListener('pointerdown', rejectionHandler);
                    window.removeEventListener('keydown', rejectionHandler);
                    if (reject) {
                        reject(new DOMException('The user aborted a request.', 'AbortError'));
                    }
                };

                window.addEventListener('pointermove', rejectionHandler);
                window.addEventListener('pointerdown', rejectionHandler);
                window.addEventListener('keydown', rejectionHandler);
            }

            input.addEventListener('change', () => {
                cleanupListenersAndMaybeReject();
                resolve(input.multiple ? Array.from(input.files) : input.files[0]);
            });

            input.click();
        });
    };

    /**
     * Opens a directory from disk using the legacy input click method.
     */
    FileBin.prototype.legacyOpenDir = async (options = {}) => {
        options.recursive = options.recursive || false;
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.webkitdirectory = true;

            let cleanupListenersAndMaybeReject;
            const rejectionHandler = () => cleanupListenersAndMaybeReject(reject);
            if (options.setupLegacyCleanupAndRejection) {
                cleanupListenersAndMaybeReject =
                    options.setupLegacyCleanupAndRejection(rejectionHandler);
            } else {
                // Default rejection behavior; works in most cases, but not in Chrome in non-secure contexts.
                cleanupListenersAndMaybeReject = (reject) => {
                    window.removeEventListener('pointermove', rejectionHandler);
                    window.removeEventListener('pointerdown', rejectionHandler);
                    window.removeEventListener('keydown', rejectionHandler);
                    if (reject) {
                        reject(new DOMException('The user aborted a request.', 'AbortError'));
                    }
                };

                window.addEventListener('pointermove', rejectionHandler);
                window.addEventListener('pointerdown', rejectionHandler);
                window.addEventListener('keydown', rejectionHandler);
            }

            input.addEventListener('change', () => {
                cleanupListenersAndMaybeReject();
                let files = Array.from(input.files);
                if (!options.recursive) {
                    files = files.filter((file) => {
                        return file.webkitRelativePath.split('/').length === 2;
                    });
                }
                resolve(files);
            });

            input.click();
        });
    };

    const openDirMethod = !supported ? self.legacyOpenDir
        : supported === 'chooseFileSystemEntries'
            ? self.openDirLegacy
            : self.openDir;

    FileBin.prototype.directoryOpen = async (...args) => {
        return await openDirMethod(...args);
    }

    const openFileMethod = !supported
        ? self.legacyOpen
        : supported === 'chooseFileSystemEntries'
            ? self.openFileLegacy
            : self.openFile;

    FileBin.prototype.fileOpen = async (...args) => {
        return await openFileMethod(...args);
    }

    const saveFileMethod = !supported
        ? self.legacySave
        : supported === 'chooseFileSystemEntries'
            ? self.saveFileLegacy
            : self.saveFile;

    FileBin.prototype.fileSave = async (...args) => {
        return await saveFileMethod(...args);
    }

}();
