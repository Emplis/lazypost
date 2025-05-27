class Toaster {
    #toast;
    #toastQ;
    #state;
    #toastIdCounter;
    #intervalId;

    constructor(toast) {
        this.#toast = toast;
        this.#toastQ = [];
        this.#intervalId = null;

        this.#state = "hidden";
        this.#toastIdCounter = 0;

        this.#startScheduler();
    }

    #showToast(id, text, useLoadingIndicator) {
        const toastText = this.#toast.querySelector(".toast-text");

        const states = ["...", "⋅..", ".⋅.", "..⋅"];

        const updateText = () => {
            if (useLoadingIndicator) {
                let currentState = Number(toastText.dataset.dotsState);

                if (isNaN(currentState)) {
                    currentState = 0;
                }

                const nextState = (currentState + 1) % states.length;

                toastText.dataset.dotsState = nextState;
                toastText.innerHTML = `${text}${states[currentState]}`;
            } else {
                toastText.innerHTML = `${text}`;
            }
        };

        if (useLoadingIndicator) {
            const intervalId = setInterval(() => {
                updateText();
            }, 500);

            this.#toast.dataset.intervalId = intervalId;
        }

        updateText();
        this.#toast.classList.add("show");
        this.#state = "visible";
        this.#toast.dataset.id = id;
    }

    #clearToast() {
        const hiddingAnimationTime = 250; // .25s based on the CSS value

        const intervalId = Number(this.#toast.dataset.intervalId);

        if (!isNaN(intervalId)) {
            clearInterval(intervalId);
        }

        this.#toast.classList.add("hide");
        this.#toast.classList.remove("show");

        this.#state = "hidding";

        setTimeout(() => {
            const toastText = this.#toast.querySelector(".toast-text");

            toastText.innerHTML = "";

            this.#toast.classList.remove("show", "hide");

            this.#state = "hidden";
        }, hiddingAnimationTime);
    }

    #startScheduler() {
        this.#intervalId = setInterval(() => {
            console.log(`Toaster Scheduler: ${this.#toastQ.length} toast waiting.`);

            if (this.#toastQ.length > 0 && this.#state == "hidden") {
                const nextToast = this.#toastQ.shift();

                const id = nextToast.id;
                const text = nextToast.text;
                const useLoadingIndicator = nextToast.useLoadingIndicator;
                const timeout = nextToast.timeout;

                this.#showToast(id, text, useLoadingIndicator);

                if (timeout > 0) {
                    setTimeout(() => {
                        this.#clearToast();
                    }, timeout);
                }
            }
        }, 250);
    }

    push(text, useLoadingIndicator, timeout) {
        const toastId = this.#toastIdCounter;

        this.#toastQ.push({
            id: toastId,
            text,
            useLoadingIndicator,
            timeout,
        });

        this.#toastIdCounter = this.#toastIdCounter + 1;

        return toastId;
    }

    clear() {
        if (this.#state == "visible") {
            this.#clearToast();
        }
    }

    remove(toastId) {
        const currentToastId = Number(this.#toast.dataset.id);

        if (!isNaN(currentToastId) && currentToastId == toastId) {
            this.#clearToast();
        } else {
            for (let i = 0; i < this.#toastQ.length; i++) {
                if (this.#toastQ[i].id == toastId) {
                    this.#toastQ.splice(i, 1);
                    console.log(`Removed toast with id ${toastId}`);
                    break;
                }
            }
        }
    }

    reset() {
        this.#toastQ.splice(0, this.#toastQ.length);
        this.#clearToast();
        this.#toastIdCounter = 0;
    }
}

window.addEventListener("load", () => {
    const toast = document.querySelector(".toast.generic");
    window.toaster = new Toaster(toast);
});
