document.addEventListener("DOMContentLoaded", () => {
    // =====================================
    // 1. FLASK API URLS
    // =====================================

    const API_URL = "http://127.0.0.1:5000/api/predict";
    const IMAGE_API_URL = "http://127.0.0.1:5000/api/predict-image";
    const HISTORY_API_URL = "http://127.0.0.1:5000/api/history";
    const CLEAR_HISTORY_API_URL =
        "http://127.0.0.1:5000/api/history/clear";

    // =====================================
    // 2. GET HTML ELEMENTS
    // =====================================

    const $ = id => document.getElementById(id);

    const tabs = document.querySelectorAll(".tab");
    const panels = document.querySelectorAll(".tab-panel");

    const newsText = $("newsText");
    const charCount = $("charCount");

    const imageInput = $("imageInput");
    const imageBrowseBtn = $("imageBrowseBtn");
    const imageUploadArea = $("imageUploadArea");
    const imagePreviewContainer = $("imagePreviewContainer");
    const imagePreview = $("imagePreview");
    const imageInfo = $("imageInfo");
    const removeImage = $("removeImage");
    const imageError = $("imageError");

    const videoInput = $("videoInput");
    const videoBrowseBtn = $("videoBrowseBtn");
    const videoUploadArea = $("videoUploadArea");
    const videoPreviewContainer = $("videoPreviewContainer");
    const videoPreview = $("videoPreview");
    const videoInfo = $("videoInfo");
    const removeVideo = $("removeVideo");

    const analyzeBtn = $("analyzeBtn");
    const clearBtn = $("clearBtn");
    const clearHistoryBtn = $("clearHistoryBtn");

    const loadingCard = $("loadingCard");
    const loadingMessage = $("loadingMessage");
    const resultCard = $("resultCard");

    const resultStatus = $("resultStatus");
    const resultTitle = $("resultTitle");
    const resultMessage = $("resultMessage");
    const confidenceValue = $("confidenceValue");
    const confidenceProgress = $("confidenceProgress");
    const progressBar = $("progressBar");

    const contentType = $("contentType");
    const sourceResult = $("sourceResult");
    const languageResult = $("languageResult");

    const extractedTextBox = $("extractedTextBox");
    const extractedText = $("extractedText");
    const copyExtractedText = $("copyExtractedText");

    const historyList = $("historyList");

    // =====================================
    // 3. APPLICATION STATE
    // =====================================

    let currentTab = "text";
    let selectedImage = null;
    let selectedVideo = null;
    let isAnalyzing = false;
    let isClearingHistory = false;

    let imageObjectURL = null;
    let videoObjectURL = null;

    // =====================================
    // 4. TAB SWITCHING
    // =====================================

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            currentTab = tab.dataset.tab;

            tabs.forEach(item => {
                const active = item === tab;
                item.classList.toggle("active", active);
                item.setAttribute("aria-selected", String(active));
            });

            panels.forEach(panel => {
                panel.classList.toggle(
                    "active",
                    panel.id === currentTab + "Panel"
                );
            });

            resultCard.hidden = true;
            hideImageError();
        });
    });

    // =====================================
    // 5. CHARACTER COUNT
    // =====================================

    function updateCharacterCount() {
        charCount.textContent = `${newsText.value.length} characters`;
    }

    newsText.addEventListener("input", updateCharacterCount);

    // =====================================
    // 6. IMAGE UPLOAD AND PREVIEW
    // =====================================

    imageBrowseBtn.addEventListener("click", event => {
        event.stopPropagation();
        imageInput.click();
    });

    imageUploadArea.addEventListener("click", event => {
        if (event.target.closest("button")) return;
        imageInput.click();
    });

    imageUploadArea.addEventListener("keydown", event => {
        if (event.target !== imageUploadArea) return;

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            imageInput.click();
        }
    });

    imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];
        if (file) handleImage(file);
    });

    function handleImage(file) {
        hideImageError();

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            showImageError("Choose a PNG, JPG, JPEG or WEBP image.");
            imageInput.value = "";
            return;
        }

        if (file.size > 8 * 1024 * 1024) {
            showImageError("Image size must be 8 MB or less.");
            imageInput.value = "";
            return;
        }

        clearImage();
        selectedImage = file;

        imageObjectURL = URL.createObjectURL(file);
        imagePreview.src = imageObjectURL;

        imagePreviewContainer.hidden = false;
        imageInfo.textContent =
            `${file.name} · ${formatFileSize(file.size)}`;

        imageUploadArea.querySelector("h3").textContent =
            "Image selected successfully";

        resultCard.hidden = true;
    }

    function clearImage() {
        selectedImage = null;
        imageInput.value = "";
        imagePreview.removeAttribute("src");
        imagePreviewContainer.hidden = true;
        imageInfo.textContent = "";

        if (imageObjectURL) {
            URL.revokeObjectURL(imageObjectURL);
            imageObjectURL = null;
        }

        imageUploadArea.querySelector("h3").textContent =
            "Choose an image to upload";
    }

    removeImage.addEventListener("click", () => {
        clearImage();
        hideImageError();
    });

    function showImageError(message) {
        imageError.textContent = message;
        imageError.hidden = false;
    }

    function hideImageError() {
        imageError.textContent = "";
        imageError.hidden = true;
    }

    // =====================================
    // 7. IMAGE DRAG AND DROP
    // =====================================

    setupDragDrop(imageUploadArea, file => handleImage(file));

    function setupDragDrop(area, onFile) {
        area.addEventListener("dragover", event => {
            event.preventDefault();
            area.classList.add("dragover");
        });

        area.addEventListener("dragleave", event => {
            if (!area.contains(event.relatedTarget)) {
                area.classList.remove("dragover");
            }
        });

        area.addEventListener("drop", event => {
            event.preventDefault();
            area.classList.remove("dragover");

            const file = event.dataTransfer.files[0];
            if (file) onFile(file);
        });
    }

    // =====================================
    // 8. VIDEO PREVIEW ONLY
    // =====================================

    videoBrowseBtn.addEventListener("click", event => {
        event.stopPropagation();
        videoInput.click();
    });

    videoUploadArea.addEventListener("click", event => {
        if (event.target.closest("button")) return;
        videoInput.click();
    });

    videoInput.addEventListener("change", () => {
        const file = videoInput.files[0];
        if (file) handleVideo(file);
    });

    setupDragDrop(videoUploadArea, file => handleVideo(file));

    function handleVideo(file) {
        if (!file.type.startsWith("video/")) {
            alert("Please choose a valid video.");
            return;
        }

        if (file.size > 100 * 1024 * 1024) {
            alert("Choose a video smaller than 100 MB.");
            return;
        }

        clearVideo();
        selectedVideo = file;

        videoObjectURL = URL.createObjectURL(file);
        videoPreview.src = videoObjectURL;
        videoPreview.load();

        videoPreviewContainer.hidden = false;
        videoInfo.textContent =
            `${file.name} · ${formatFileSize(file.size)}`;
    }

    function clearVideo() {
        selectedVideo = null;
        videoInput.value = "";

        videoPreview.pause();
        videoPreview.removeAttribute("src");
        videoPreview.load();
        videoPreviewContainer.hidden = true;
        videoInfo.textContent = "";

        if (videoObjectURL) {
            URL.revokeObjectURL(videoObjectURL);
            videoObjectURL = null;
        }
    }

    removeVideo.addEventListener("click", clearVideo);

    // =====================================
    // 9. ANALYZE BUTTON
    // =====================================

    analyzeBtn.addEventListener("click", analyzeContent);

    async function analyzeContent() {
        if (isAnalyzing) return;

        resultCard.hidden = true;

        if (currentTab === "image") {
            if (!selectedImage) {
                showImageError("Please choose an image first.");
                return;
            }

            hideImageError();
            await analyzeImageContent();
            return;
        }

        if (currentTab === "video") {
            alert(
                "Video preview works, but video text extraction " +
                "and prediction are not implemented yet."
            );
            return;
        }

        const text = newsText.value.trim();

        if (text.length < 20) {
            alert("Please enter at least 20 characters of news text.");
            newsText.focus();
            return;
        }

        isAnalyzing = true;
        setLoading(true, "Sending text to the ML model...");

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ news: text })
            });

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            showPrediction(data, "Text");
            await loadPredictionHistory();

        } catch (error) {
            console.error("Text prediction error:", error);
            alert("Text prediction failed:\n" + error.message);

        } finally {
            setLoading(false);
        }
    }

    // =====================================
    // 10. IMAGE OCR + ML PREDICTION
    // =====================================

    async function analyzeImageContent() {
        if (isAnalyzing || !selectedImage) return;

        isAnalyzing = true;
        setLoading(true, "Uploading image and extracting text...");

        try {
            const formData = new FormData();

            // Flask endpoint expects the form field name "image".
            formData.append("image", selectedImage);

            const response = await fetch(IMAGE_API_URL, {
                method: "POST",
                body: formData
            });

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.error || `Image API error: HTTP ${response.status}`
                );
            }

            if (typeof data.prediction !== "string") {
                throw new Error(
                    "No prediction received. Check the Flask endpoint response."
                );
            }

            const textFromImage = String(
                data.extracted_text || ""
            ).trim();

            if (textFromImage) {
                newsText.value = textFromImage;
                updateCharacterCount();
            }

            showPrediction(data, "Image (OCR)");

            // Display OCR text separately in the results.
            if (textFromImage) {
                extractedText.textContent = textFromImage;
                extractedTextBox.hidden = false;
            } else {
                extractedText.textContent =
                    "No readable text was returned by OCR.";
                extractedTextBox.hidden = false;
            }

            await loadPredictionHistory();

        } catch (error) {
            console.error("Image analysis error:", error);

            showImageError(
                "Image analysis failed: " + error.message +
                " Check that Flask is running and OCR is installed."
            );

        } finally {
            setLoading(false);
        }
    }

    // =====================================
    // 11. READ JSON RESPONSE
    // =====================================

    async function readResponse(response) {
        const body = await response.text();

        try {
            return body ? JSON.parse(body) : {};
        } catch {
            throw new Error(
                "Backend did not return JSON. Check the Flask terminal."
            );
        }
    }

    // =====================================
    // 12. SHOW PREDICTION
    // =====================================

    function showPrediction(data, defaultType) {
        const prediction = String(data.prediction || "").toUpperCase();

        let status = "UNCERTAIN";

        if (prediction.includes("FAKE")) {
            status = "FAKE";
        } else if (prediction.includes("REAL")) {
            status = "REAL";
        } else if (prediction.includes("UNCERTAIN")) {
            status = "UNCERTAIN";
        }

        const confidence = Math.max(
            0,
            Math.min(100, Number(data.confidence) || 0)
        );

        displayResult({
            status,
            confidence,
            type: data.content_type || defaultType,
            source: data.source || "Trained ML Model",
            message: data.message ||
                "This is a model prediction, not a verified fact-check."
        });
    }

    function displayResult(result) {
        resultCard.hidden = false;

        resultStatus.textContent = result.status;
        resultStatus.className = "result-status " +
            result.status.toLowerCase();

        if (result.status === "FAKE") {
            resultTitle.textContent = "Model predicts potentially misleading content";
        } else if (result.status === "REAL") {
            resultTitle.textContent = "Model predicts likely real content";
        } else {
            resultTitle.textContent = "Prediction is uncertain";
        }

        resultMessage.textContent = result.message;

        confidenceValue.textContent =
            `${result.confidence.toFixed(2)}%`;

        progressBar.style.width = `${result.confidence}%`;
        progressBar.className =
            "progress-bar " + result.status.toLowerCase();

        confidenceProgress.setAttribute(
            "aria-valuenow",
            String(Math.round(result.confidence))
        );

        contentType.textContent = result.type;
        sourceResult.textContent = result.source;
        languageResult.textContent =
            result.type.includes("Image")
                ? "OCR + Text Classification"
                : "Text Classification";

        resultCard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    // =====================================
    // 13. LOADING INDICATOR
    // =====================================

    function setLoading(active, message = "") {
        loadingCard.hidden = !active;
        loadingMessage.textContent = message;
        analyzeBtn.disabled = active;
        clearBtn.disabled = active;

        analyzeBtn.textContent = active
            ? "Analyzing..."
            : "🔍 Analyze content";

        if (!active) {
            isAnalyzing = false;
        }
    }

    // =====================================
    // 14. LOAD SAVED HISTORY
    // =====================================

    async function loadPredictionHistory() {
        try {
            const response = await fetch(HISTORY_API_URL);
            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(data.error || "Could not load history.");
            }

            renderHistory(Array.isArray(data.history) ? data.history : []);

        } catch (error) {
            console.error("History loading error:", error);
            historyList.textContent =
                "History is unavailable. Check the Flask backend.";
        }
    }

    function renderHistory(items) {
        historyList.replaceChildren();

        if (!items.length) {
            const empty = document.createElement("div");
            empty.className = "empty-history";
            empty.textContent = "No content analyzed yet.";
            historyList.appendChild(empty);
            return;
        }

        items.forEach(item => {
            const row = document.createElement("div");
            row.className = "history-item";

            const left = document.createElement("div");
            left.className = "history-left";

            const icon = document.createElement("div");
            icon.className = "history-icon";
            icon.textContent = "📰";

            const info = document.createElement("div");
            info.className = "history-info";

            const title = document.createElement("div");
            title.className = "history-title";

            const news = String(item.news || "Analyzed content");
            title.textContent = news.length > 110
                ? news.slice(0, 110) + "..."
                : news;
            title.title = news;

            const confidence = document.createElement("div");
            confidence.className = "history-type";
            confidence.textContent =
                `Confidence: ${item.confidence ?? 0}%`;

            const date = document.createElement("div");
            date.className = "history-date";
            date.textContent = item.created_at || "";

            info.append(title, confidence, date);
            left.append(icon, info);

            const status = document.createElement("span");
            const prediction = String(
                item.prediction || "UNKNOWN"
            ).toUpperCase();

            status.className = "history-status";

            if (prediction.includes("FAKE")) {
                status.classList.add("fake");
            } else if (prediction.includes("REAL")) {
                status.classList.add("real");
            }

            status.textContent = prediction;

            row.append(left, status);
            historyList.appendChild(row);
        });
    }

    // =====================================
    // 15. CLEAR INPUTS
    // =====================================

    clearBtn.addEventListener("click", () => {
        if (isAnalyzing) return;

        newsText.value = "";
        updateCharacterCount();

        clearImage();
        clearVideo();
        hideImageError();

        extractedText.textContent = "";
        extractedTextBox.hidden = true;
        resultCard.hidden = true;

        tabs.forEach(tab => {
            const active = tab.dataset.tab === "text";
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", String(active));
        });

        panels.forEach(panel => {
            panel.classList.toggle("active", panel.id === "textPanel");
        });

        currentTab = "text";
    });

    // =====================================
    // 16. CLEAR SAVED HISTORY
    // =====================================

    clearHistoryBtn.addEventListener("click", async () => {
        if (isClearingHistory || isAnalyzing) return;

        const confirmed = confirm(
            "Delete all saved prediction history?"
        );

        if (!confirmed) return;

        isClearingHistory = true;
        clearHistoryBtn.disabled = true;

        try {
            const response = await fetch(CLEAR_HISTORY_API_URL, {
                method: "DELETE"
            });

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(data.error || "Unable to clear history.");
            }

            await loadPredictionHistory();
            alert("Prediction history cleared.");

        } catch (error) {
            console.error("Clear history error:", error);
            alert("Could not clear history:\n" + error.message);

        } finally {
            isClearingHistory = false;
            clearHistoryBtn.disabled = false;
        }
    });

    // =====================================
    // 17. COPY OCR TEXT
    // =====================================

    copyExtractedText.addEventListener("click", async () => {
        const text = extractedText.textContent.trim();

        if (!text) {
            alert("There is no extracted text to copy.");
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            alert("Extracted text copied.");
        } catch {
            alert("Copy failed. Select the extracted text and copy it manually.");
        }
    });

    // =====================================
    // 18. FILE SIZE FORMATTER
    // =====================================

    function formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} Bytes`;

        const units = ["KB", "MB", "GB"];
        let size = bytes / 1024;
        let unit = 0;

        while (size >= 1024 && unit < units.length - 1) {
            size /= 1024;
            unit++;
        }

        return `${size.toFixed(2)} ${units[unit]}`;
    }

    // =====================================
    // 19. INITIALIZE
    // =====================================

    updateCharacterCount();
    loadPredictionHistory();

    console.log("NewsCheck frontend initialized.");
});