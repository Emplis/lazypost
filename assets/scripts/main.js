async function getChallenge() {
    const CHALLENGE_ENDPOINT_URL = "/request-challenge";

    try {
        const response = await fetch(CHALLENGE_ENDPOINT_URL);

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();

        return json.challenge;
    } catch (error) {
        console.error(error.message);
    }
}

function solveChallenge(challenge, worker) {
    const salt = challenge.salt;
    const hash = challenge.hash;
    const maxIteration = 1000000;
    const nbrWorker = challenge.worker ?? 4;

    worker.postMessage({
        type: "challenge",
        salt,
        hash,
        maxIteration,
        nbrWorker,
    });
}

function switchInputsState(form) {
    const senderInputs = form.querySelector("fieldset[name=sender-info]");
    const recipientInputs = form.querySelector("fieldset[name=recipient-info]");
    const messageTextarea = form.querySelector("textarea[name=message]");
    const pictureInput = form.querySelector("input[type=file]");

    senderInputs.disabled = !senderInputs.disabled;
    recipientInputs.disabled = !recipientInputs.disabled;
    messageTextarea.disabled = !messageTextarea.disabled;
    pictureInput.disabled = !pictureInput.disabled;
}

function initialize() {
    const worker = new Worker("assets/scripts/worker.js");

    const answerField = document.getElementById("challenge-answer");
    const saltField = document.getElementById("challenge-salt");
    const hashField = document.getElementById("challenge-hash");
    const form = document.querySelector(".form-container > form");
    const submitBtn = form.querySelector("input[type=submit]");

    worker.addEventListener("message", (e) => {
        const data = e.data;

        if (data.type == "answer") {
            answerField.value = data.answer;
            answerField.dataset.time = data.time;
            saltField.value = data.salt;
            hashField.value = data.hash;

            submitBtn.disabled = false;
            switchInputsState(form);

            window.toaster.clear();

            form.requestSubmit(submitBtn);
        } else {
            throw new Error("Unexpected message from worker.");
        }
    });

    form.addEventListener("submit", async (e) => {
        if (answerField.value == "") {
            const toastBaseText = "Waiting for someone to pick up your card";

            e.preventDefault();

            submitBtn.disabled = true;
            switchInputsState(form);

            window.toaster.push(toastBaseText, true, 0);

            const challenge = await getChallenge();
            solveChallenge(challenge, worker);
        }
    });

    window.addEventListener("pageshow", (e) => {
        if (e.persisted) {
            answerField.value = "";
            saltField.value = "";
            hashField.value = "";

            window.toaster.reset();
        }
    });
}

window.addEventListener("load", () => {
    initialize();
});
