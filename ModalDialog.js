/**
 * ## ModalDialog Web Component
 * Custom dialog components using a Promise-based modal for user interaction.
 *
 * ## Example:
 * ```
 * // Replace the native javascript functions
 * const alert   = modal.alert,
 *       prompt  = modal.prompt,
 *       confirm = modal.confirm;
 *
 * let reset = async () => {
 *     let result = await confirm("Are you sure you want to reset the application? <br /><br /> This will erase all your saved data and cannot be undone.", "Reset Application?");
 *     if (result === true) {
 *         let done = await resetFunction();
 *         if (done) {
 *             alert("This application has been successfully reset!", "Finished!");
 *         } else {
 *             alert("Something went wrong! You're settings remain unchanged.", "Unexpected Error!");
 *         }
 *     } else if (result === false) {
 *         alert("This application was not reset! You're settings remain unchanged", "Reset Canceled!");
 *     }
 * }
 * ```
 */
class ModalDialogElement extends HTMLElement {

    constructor() {
        super();
        this.build();
    }

    /**
     * Assigns and builds the dialog
     */
    build() {
        this.attachShadow({ mode: "open" });
        const modalDialog = document.createElement("div");
        modalDialog.classList.add("modal-dialog-window");

        const dialogElement = document.createElement("div");
        const dialogHeader = document.createElement("div");
        const dialogBody = document.createElement("div");
        const dialogFooter = document.createElement("div");

        dialogElement.classList.add("modal-dialog");
        dialogHeader.classList.add("modal-dialog-header");
        dialogBody.classList.add("modal-dialog-body");
        dialogFooter.classList.add("modal-dialog-footer");
        dialogBody.append(document.createElement("p"));
        dialogElement.append(dialogHeader, dialogBody, dialogFooter);
        modalDialog.append(dialogElement);

        const style = document.createElement("style");
        style.textContent = this.setStyle();
        this.shadowRoot.append(style, modalDialog);
    }

    /**
     * Returns the CSS styles for the modal dialogs.
     * @param {string} cssPadding the amount of padding for the modal
     */
    setStyle(cssPadding= '1em') {
        const padding = cssPadding;
        return `
      .modal-dialog-window {
        user-select: none;
        font-family: inherit;
        font-size: inherit;
        z-index: 999;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: auto;
        position: fixed;
        top: 0;
        left: 0;
      }
      
      .modal-dialog {
        width: calc(100% - 2em);
        max-width: 400px;
        overflow: hidden;
        box-sizing: border-box;
        box-shadow: 0 0.5em 1em rgba(0, 0, 0, 0.5);
        border-radius: 0.3em;
        animation: modal-dialog-show 265ms cubic-bezier(0.18, 0.89, 0.32, 1.28)
      }
      
      .modal-dialog.modal-dialog-hide {
        opacity: 0;
        animation: modal-dialog-hide 265ms ease-in;
      }
      
      @keyframes modal-dialog-show {
        0% {
          opacity: 0;
          transform: translateY(-100%);
        }
        100% {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes modal-dialog-hide {
        0% {
          opacity: 1;
          transform: translateX(0);
        }
        100% {
          opacity: 0;
          transform: translateY(-50%);
        }
      }
      
      .modal-dialog-header {
        font-family: 'Inika', serif;
        color: inherit;
        background-color: rgba(0, 0, 0, 0.05);
        padding: ${padding};
        border-bottom: solid 1px rgba(0, 0, 0, 0.15);
      }
      
      .modal-dialog-body {
        color: inherit;
        padding: ${padding};
      }
      
      .modal-dialog-body > p {
        color: inherit;
        padding: 0;
        margin: 0;
      }
      
      .modal-dialog-footer {
        color: inherit;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: stretch;
      }
      
      .modal-dialog-button {
        color: inherit;
        font-family: inherit;
        font-size: inherit;
        background-color: rgba(0, 0, 0, 0);
        width: 100%;
        padding: 1em;
        border: none;
        border-top: solid 1px rgba(0, 0, 0, 0.15);
        outline: 0;
        border-radius: 0px;
        transition: background-color 225ms ease-out;
      }
      
      .modal-dialog-button:focus {
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      .modal-dialog-button:active {
        background-color: rgba(0, 0, 0, 0.15);
      }
      
      .modal-dialog-input {
        color: inherit;
        font-family: inherit;
        font-size: inherit;
        width: 100%;
        padding: 0.5em;
        border: solid 1px rgba(0, 0, 0, 0.15);
        margin-top: ${padding};
        outline: 0;
        box-sizing: border-box;
        border-radius: 0;
        box-shadow: 0 0 0 0 rgba(13, 134, 255, 0.5);
        transition: box-shadow 125ms ease-out, border 125ms ease-out;
      }
      
      .modal-dialog-input:focus {
        border: solid 1px rgba(13, 134, 255, 0.8);
        box-shadow: 0 0 0.1em 0.2em rgba(13, 134, 255, 0.5);
      }
      
      @media (prefers-color-scheme: dark) {
        .modal-dialog-window {
          background-color: rgba(31, 31, 31, 0.5);
        }
        
        .modal-dialog {
          color: #f2f2f2;
          background-color: #464646;
        }
        
        .modal-dialog-input {
          background-color: #2f2f2f;
        }
      }
      
      @media (prefers-color-scheme: light) {
        .modal-dialog-window {
          background-color: rgba(221, 221, 221, 0.5);
        }
        
        .modal-dialog {
          color: #101010;
          background-color: #ffffff;
        }
      }
    `;
    }

    /**
     * Creates a dialog with the specified content and optional title header.
     * @param {string} content the message to alert the client
     * @param {string} title optional title for the dialog modal
     */
    createDialog(content, title= undefined) {
        const dialogHeader = this.shadowRoot.querySelector(".modal-dialog-header");
        const dialogBody = this.shadowRoot.querySelector(".modal-dialog-body > p");
        dialogBody.innerHTML = content;
        if (title === undefined) {
            dialogHeader.remove();
        }
        else {
            dialogHeader.innerHTML = title;
        }
    }

    /**
     * Removes a dialog after listening for the 'animationend' event to trigger
     */
    disposeDialog() {
        const self = this;
        const dialogElement = self.shadowRoot.querySelector(".modal-dialog");
        dialogElement.classList.add("modal-dialog-hide");
        dialogElement.addEventListener("animationend", function dialogElementAnimationEnd(event) {
            if (event.animationName === "modal-dialog-hide") {
                dialogElement.removeEventListener("animationend", dialogElementAnimationEnd);
                self.remove();
            }
        });
    }
}

/**
 * Promised-based alert dialog
 */
class AlertModalDialog extends ModalDialogElement {

    constructor() {
        super();
        this.setDefault()
    }

    /**
     * Sets the default values for the modal dialog
     */
    setDefault() {
        let content = this.dataset.content;
        let title = this.dataset.title;
        if (typeof content === "undefined") {
            return;
        }
        if (typeof title === "undefined") {
            title = null;
        }
        this.setAlert(content, title);
    }

    /**
     * Creates an alert dialog modal that waits for user interaction.
     * @param {string} content the message to alert the client
     * @param {string} title optional title for the dialog modal
     * @returns {Promise<boolean>}
     */
    setAlert(content, title) {
        const self = this;
        self.createDialog(content, title);
        const dialogFooterElm = self.shadowRoot.querySelector(".modal-dialog-footer");
        const dialogConfirmBtn = document.createElement("button");
        dialogConfirmBtn.classList.add("modal-dialog-button");
        dialogConfirmBtn.innerText = "OK";
        dialogFooterElm.append(dialogConfirmBtn);
        dialogConfirmBtn.focus();
        return new Promise(function (resolve) {
            dialogConfirmBtn.addEventListener("click", function dialogConfirmBtnClick() {
                dialogConfirmBtn.removeEventListener("click", dialogConfirmBtnClick);
                self.disposeDialog();
                resolve(true);
            });
        });
    }
}

// Declare the custom alert modal dialog element as a web component
customElements.define("modal-alert", AlertModalDialog);

class ConfirmModalDialog extends ModalDialogElement {

    constructor() {
        super();
        this.setDefault();
    }

    /**
     * Sets the default values for the modal dialog
     */
    setDefault() {
        let content = this.dataset.content;
        let title = this.dataset.title;
        if (typeof content === "undefined") {
            return;
        }
        if (typeof title === "undefined") {
            title = null;
        }
        this.setConfirm(content, title);
    }

    /**
     * Creates a confirm dialog modal that waits for user interaction.
     * @param {string} condition the message inquiry for the client 
     * @param {string} title optional title for the dialog modal
     * @returns {Promise<boolean>}
     */
    setConfirm(condition, title) {
        const self = this;
        self.createDialog(condition, title);
        const dialogFooter = self.shadowRoot.querySelector(".modal-dialog-footer");
        const dialogBtnCancel = document.createElement("button");
        const dialogBtnConfirm = document.createElement("button");
        dialogBtnCancel.classList.add("modal-dialog-button");
        dialogBtnCancel.innerText = "Cancel";
        dialogBtnConfirm.classList.add("modal-dialog-button");
        dialogBtnConfirm.innerText = "OK";
        dialogFooter.append(dialogBtnCancel, dialogBtnConfirm);
        dialogBtnCancel.focus();
        return new Promise(function (resolve) {
            dialogBtnCancel.addEventListener("click", function dialogBtnCancelClick() {
                this.removeEventListener("click", dialogBtnCancelClick);
                self.disposeDialog();
                resolve(false);
            });
            dialogBtnConfirm.addEventListener("click", function dialogBtnConfirmClick() {
                this.removeEventListener("click", dialogBtnConfirmClick);
                self.disposeDialog();
                resolve(true);
            });
        });
    }
}

// Declare the custom confirm modal dialog element as a web component
customElements.define("modal-confirm", ConfirmModalDialog);

class PromptModalDialog extends ModalDialogElement {

    constructor() {
        super();
        this.setDefault();
    }

    /**
     * Sets the default values for the modal dialog
     */
    setDefault() {
        let content = this.dataset.content;
        let title = this.dataset.title;
        if (typeof content === "undefined") {
            return;
        }
        if (typeof title === "undefined") {
            title = null;
        }
        this.setPrompt(content, title);
    }

    /**
     * Creates a prompt dialog modal that waits for user interaction.
     * @param {string} content the message to prompt the client
     * @param {string} title optional title for the dialog modal
     * @returns {Promise<value>}
     */
    setPrompt(content, title) {
        const self = this;
        self.createDialog(content, title);
        const dialogBody = self.shadowRoot.querySelector(".modal-dialog-body");
        const dialogInputWrapper = document.createElement("p");
        const dialogInput = document.createElement("input");
        dialogInput.classList.add("modal-dialog-textbox");
        dialogInput.type = "text";
        dialogInputWrapper.append(dialogInput);
        dialogBody.append(dialogInputWrapper);
        const dialogFooter = self.shadowRoot.querySelector(".modal-dialog-footer");
        const dialogBtnCancel = document.createElement("button");
        const dialogBtnConfirm = document.createElement("button");
        dialogBtnCancel.classList.add("modal-dialog-button");
        dialogBtnCancel.innerText = "Cancel";
        dialogBtnConfirm.classList.add("modal-dialog-button");
        dialogBtnConfirm.innerText = "OK";
        dialogFooter.append(dialogBtnCancel, dialogBtnConfirm);
        dialogInput.focus();

        /**
         * Listen for the <code>Enter</code> key press event.
         * @param {event} e handler for the key press event
         */
        function dialogInputKeyPress(e) {
            if (e.key === "Enter") {
                dialogBtnConfirm.click();
            }
        }
        dialogInput.addEventListener("keypress", dialogInputKeyPress);
        return new Promise(function (resolve) {
            let userInput = null;
            dialogBtnCancel.addEventListener("click", function dialogBtnCancelClick() {
                this.removeEventListener("click", dialogBtnCancelClick);
                dialogInput.removeEventListener("keypress", dialogInputKeyPress);
                self.disposeDialog();
                resolve(userInput);
            });
            dialogBtnConfirm.addEventListener("click", function dialogBtnConfirmClick() {
                this.removeEventListener("click", dialogBtnConfirmClick);
                dialogInput.removeEventListener("keypress", dialogInputKeyPress);
                self.disposeDialog();
                userInput = dialogInput.value;
                resolve(userInput);
            });
        });
    }
}

// Declare the custom prompt modal dialog element as a web component
customElements.define("modal-prompt", PromptModalDialog);

/**
 * Class to handle the rendering of the custom ModalDialog elements.
 */
class modal {
    static async alert(content, title) {
        const alertDialog = document.createElement("modal-alert");
        document.body.appendChild(alertDialog);
        return await alertDialog.setAlert(content, title);
    }
    static async confirm(content, title = null) {
        const confirmDialog = document.createElement("modal-confirm");
        document.body.appendChild(confirmDialog);
        return await confirmDialog.setConfirm(content, title);
    }
    static async prompt(content, title = null) {
        const promptDialog = document.createElement("modal-prompt");
        document.body.appendChild(promptDialog);
        return await promptDialog.setPrompt(content, title);
    }
}
