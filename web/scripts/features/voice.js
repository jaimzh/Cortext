function getAudioMimeType() {
    if (MediaRecorder.isTypeSupported("audio/webm")) {
        return "audio/webm";
    }

    return "";
}

function getModelOptionText(model) {
    const status = model.installed ? model.description : "download from TUI";
    return `${model.label} - ${status}`;
}

export function initVoice(elements, api) {
    const {
        recordButton,
        recordLabel,
        pasteToggle,
        modelSelect,
        statusText,
        resultText,
    } = elements;

    let mediaRecorder = null;
    let audioChunks = [];
    let stream = null;

    async function loadModels() {
        const data = await api.loadModels();

        if (!data) {
            return;
        }

        modelSelect.innerHTML = "";

        for (const model of data.models) {
            const option = document.createElement("option");
            option.value = model.name;
            option.textContent = getModelOptionText(model);
            option.disabled = !model.installed;

            if (model.name === data.default && model.installed) {
                option.selected = true;
            }

            modelSelect.appendChild(option);
        }
    }

    async function startRecording() {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        audioChunks = [];
        const mimeType = getAudioMimeType();
        mediaRecorder = new MediaRecorder(
            stream,
            mimeType ? { mimeType } : undefined,
        );

        mediaRecorder.addEventListener("dataavailable", (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        });

        mediaRecorder.addEventListener("stop", async () => {
            recordButton.disabled = true;
            recordButton.classList.remove("recording");
            recordLabel.textContent = "Start Recording";
            statusText.textContent = "Uploading and transcribing...";

            try {
                const audioBlob = new Blob(audioChunks, {
                    type: mediaRecorder.mimeType || "audio/webm",
                });

                const data = await api.uploadAudio(audioBlob, {
                    paste: pasteToggle.checked,
                    model: modelSelect.value,
                });
                statusText.textContent = data.message || "Done";
                resultText.textContent = data.text || "";
            } catch (error) {
                statusText.textContent = "Something went wrong.";
                resultText.textContent = error.message;
            } finally {
                if (stream) {
                    stream.getTracks().forEach((track) => track.stop());
                }

                recordButton.disabled = false;
                stream = null;
            }
        });

        mediaRecorder.start();
        recordButton.classList.add("recording");
        recordLabel.textContent = "Stop Recording";
        statusText.textContent = "Recording...";
        resultText.textContent = "";
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }
    }

    recordButton.addEventListener("click", async () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            stopRecording();
            return;
        }

        try {
            await startRecording();
        } catch (error) {
            statusText.textContent = "Microphone access failed.";
            resultText.textContent = error.message;
        }
    });

    loadModels();
}
