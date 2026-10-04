const API = "/api";

const searchInput = document.getElementById("search");
const searchButton = document.querySelector("#search + button");
const modelGrid = document.getElementById("model-grid");
const modelCount = document.getElementById("count");


/* =====================================================
   HELPERS
===================================================== */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatNumber(value) {

    if (value === null || value === undefined) {
        return "—";
    }

    if (typeof value === "number") {
        return value.toLocaleString();
    }

    return escapeHtml(value);
}


function formatPrice(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "Not listed";
    }

    return String(value);
}


function getStatusLabel(status) {

    if (status === "legacy") {
        return "Legacy";
    }

    if (status === "preview") {
        return "Preview";
    }

    return "Current";
}


function getStatusClass(status) {

    if (status === "legacy") {
        return "status-legacy";
    }

    if (status === "preview") {
        return "status-preview";
    }

    return "status-current";
}


function getHardwareLabel(score) {

    if (score === null || score === undefined) {
        return "Not evaluated";
    }

    if (score >= 80) {
        return "Good fit";
    }

    if (score >= 50) {
        return "Possible fit";
    }

    if (score >= 25) {
        return "Hardware constrained";
    }

    return "Difficult fit";
}


function getHardwareClass(score) {

    if (score === null || score === undefined) {
        return "hardware-neutral";
    }

    if (score >= 80) {
        return "hardware-good";
    }

    if (score >= 50) {
        return "hardware-possible";
    }

    return "hardware-warning";
}


function getFreeLabel(model) {

    if (model.api_free_tier === true) {
        return "API Free Tier";
    }

    if (model.consumer_free === true) {
        return "Consumer Free";
    }

    if (
        model.local === true &&
        model.open_weights === true
    ) {
        return "Free to run locally";
    }

    return "Paid";
}


/* =====================================================
   MODEL DETAIL PAGE
===================================================== */

async function loadModelDetail(modelId) {

    try {

        const response = await fetch(
            `${API}/models/${encodeURIComponent(modelId)}`,
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `Model API returned ${response.status}`
            );
        }

        const model = await response.json();

        if (model.error) {
            throw new Error(model.error);
        }

        document.title =
            `${model.name} — EPRAT AI`;

        const metaDescription =
            document.querySelector('meta[name="description"]');

        const descriptionText =
            `${model.name} by ${model.provider}. ${model.description || ""} Compare capabilities, context, pricing, deployment options and use cases with EPRAT AI.`;

        if (metaDescription) {
            metaDescription.setAttribute(
                "content",
                descriptionText
            );
        } else {
            const meta = document.createElement("meta");
            meta.name = "description";
            meta.content = descriptionText;
            document.head.appendChild(meta);
        }

        let canonical =
            document.querySelector('link[rel="canonical"]');

        const canonicalUrl =
            `${window.location.origin}/models/${encodeURIComponent(model.id)}`;

        if (!canonical) {
            canonical = document.createElement("link");
            canonical.rel = "canonical";
            document.head.appendChild(canonical);
        }

        canonical.href = canonicalUrl;

        const status =
            model.status || "current";

        document.body.innerHTML = `

            <div class="detail-page">

                <header class="detail-header">

                    <a href="/" class="detail-logo">
                        EPRAT <span>AI</span>
                    </a>

                    <nav>
                        <a href="/">Models</a>
                        <a href="/#compare">Compare</a>
                    </nav>

                </header>


                <main class="detail-container">

                    <a href="/" class="back-link">
                        ← Back to AI Models
                    </a>


                    <section class="detail-hero">

                        <div>

                            <div class="detail-provider">
                                ${escapeHtml(model.provider)}
                            </div>

                            <h1>
                                ${escapeHtml(model.name)}
                            </h1>

                            <div class="detail-status-row">

                                <span class="
                                    model-status
                                    ${getStatusClass(status)}
                                ">
                                    ${getStatusLabel(status)}
                                </span>

                                ${
                                    model.open_weights
                                        ? `
                                            <span class="model-status status-open">
                                                Open Weights
                                            </span>
                                          `
                                        : ""
                                }

                            </div>

                            <p>
                                ${escapeHtml(model.description)}
                            </p>

                            <div class="detail-tags">

                                ${(model.category || [])
                                    .map(category =>
                                        `<span>
                                            ${escapeHtml(category)}
                                        </span>`
                                    )
                                    .join("")}

                            </div>

                        </div>


                        <div class="detail-score">

                            <strong>
                                ${model.coding ?? "—"}
                            </strong>

                            <span>
                                Coding
                            </span>

                        </div>

                    </section>


                    <section class="detail-grid">

                        <div class="detail-card">

                            <h2>Capabilities</h2>

                            <div class="metric">
                                <span>Coding</span>
                                <strong>
                                    ${model.coding ?? "—"}/100
                                </strong>
                            </div>

                            <div class="metric">
                                <span>Reasoning</span>
                                <strong>
                                    ${model.reasoning ?? "—"}/100
                                </strong>
                            </div>

                            <div class="metric">
                                <span>Multimodal</span>
                                <strong>
                                    ${model.multimodal ? "Yes" : "No"}
                                </strong>
                            </div>

                        </div>


                        <div class="detail-card">

                            <h2>Technical</h2>

                            <div class="metric">
                                <span>Context</span>
                                <strong>
                                    ${formatNumber(model.context)}
                                </strong>
                            </div>

                            <div class="metric">
                                <span>Extended Context</span>
                                <strong>
                                    ${formatNumber(
                                        model.extended_context
                                    )}
                                </strong>
                            </div>

                            <div class="metric">
                                <span>Deployment</span>
                                <strong>
                                    ${model.local
                                        ? "Local"
                                        : "Cloud"}
                                </strong>
                            </div>

                            <div class="metric">
                                <span>Open Weights</span>
                                <strong>
                                    ${model.open_weights
                                        ? "Yes"
                                        : "No"}
                                </strong>
                            </div>

                            <div class="metric">
                                <span>Ollama</span>
                                <strong>
                                    ${model.ollama
                                        ? "Yes"
                                        : "No"}
                                </strong>
                            </div>

                        </div>


                        <div class="detail-card">

                            <h2>Pricing</h2>

                            <div class="metric">
                                <span>Input / 1M</span>
                                <strong>
                                    ${formatPrice(
                                        model.input_price_per_1m
                                    )}
                                </strong>
                            </div>

                            <div class="metric">
                                <span>Cached / 1M</span>
                                <strong>
                                    ${formatPrice(
                                        model.cached_input_price_per_1m
                                    )}
                                </strong>
                            </div>

                            <div class="metric">
                                <span>Output / 1M</span>
                                <strong>
                                    ${formatPrice(
                                        model.output_price_per_1m
                                    )}
                                </strong>
                            </div>

                            <div class="metric">
                                <span>Access</span>
                                <strong>
                                    ${escapeHtml(
                                        getFreeLabel(model)
                                    )}
                                </strong>
                            </div>

                        </div>


                        <div class="detail-card">

                            <h2>Hardware</h2>

                            <div class="hardware-value">
                                ${escapeHtml(
                                    model.hardware ||
                                    "Hardware requirements not listed."
                                )}
                            </div>

                        </div>

                    </section>


                    <section class="detail-card best-for">

                        <h2>
                            Why consider
                            ${escapeHtml(model.name)}?
                        </h2>

                        <p>
                            EPRAT AI evaluates models using capability,
                            deployment options, hardware suitability,
                            availability and practical usage characteristics.
                        </p>

                        <div class="recommendation-points">

                            <div>
                                <strong>Coding</strong>
                                <span>
                                    ${model.coding ?? "—"}/100
                                </span>
                            </div>

                            <div>
                                <strong>Reasoning</strong>
                                <span>
                                    ${model.reasoning ?? "—"}/100
                                </span>
                            </div>

                            <div>
                                <strong>Local AI</strong>
                                <span>
                                    ${model.local
                                        ? "Supported"
                                        : "Cloud only"}
                                </span>
                            </div>

                            <div>
                                <strong>Ollama</strong>
                                <span>
                                    ${model.ollama
                                        ? "Supported"
                                        : "Not listed"}
                                </span>
                            </div>

                        </div>

                    </section>


                    <section class="detail-card">

                        <h2>Use Cases</h2>

                        <div class="use-case-list">

                            ${(model.use_cases || [])
                                .map(item =>
                                    `<span>
                                        ${escapeHtml(item)}
                                    </span>`
                                )
                                .join("")}

                        </div>

                    </section>


                    <section class="detail-actions">

                        <a
                            href="${escapeHtml(model.official)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="official-button"
                        >
                            Visit Official Model Page ↗
                        </a>

                        <a
                            href="/"
                            class="secondary-button"
                        >
                            Find Another AI
                        </a>

                    </section>

                </main>


                <footer class="detail-footer">

                    <strong>EPRAT AI</strong>

                    <span>
                        Find the right AI. Compare it. Test it. Use it.
                    </span>

                </footer>

            </div>


            <style>

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    background: #080b12;
                    color: #f5f7fb;
                    font-family:
                        Inter,
                        system-ui,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;
                }

                .detail-page {
                    min-height: 100vh;
                }

                .detail-header {
                    height: 70px;
                    padding: 0 7%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid #202738;
                }

                .detail-logo {
                    color: white;
                    text-decoration: none;
                    font-weight: 800;
                    font-size: 21px;
                }

                .detail-logo span {
                    color: #8290ff;
                }

                .detail-header nav {
                    display: flex;
                    gap: 25px;
                }

                .detail-header nav a {
                    color: #9eacc5;
                    text-decoration: none;
                }

                .detail-container {
                    max-width: 1050px;
                    margin: auto;
                    padding: 55px 25px 80px;
                }

                .back-link {
                    color: #8d9aff;
                    text-decoration: none;
                    display: inline-block;
                    margin-bottom: 35px;
                }

                .detail-hero {
                    display: flex;
                    justify-content: space-between;
                    gap: 30px;
                    padding: 35px;
                    border: 1px solid #293246;
                    border-radius: 20px;
                    background: #111722;
                }

                .detail-provider {
                    color: #8498ff;
                    font-size: 13px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .detail-hero h1 {
                    font-size: 48px;
                    margin: 10px 0;
                }

                .detail-hero p {
                    color: #aab6ca;
                    max-width: 700px;
                    line-height: 1.7;
                }

                .detail-status-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin: 14px 0;
                }

                .model-status {
                    display: inline-flex;
                    padding: 6px 10px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: .5px;
                }

                .status-current {
                    background: #17342a;
                    color: #7ce0ad;
                }

                .status-preview {
                    background: #352e18;
                    color: #e8c76c;
                }

                .status-legacy {
                    background: #352026;
                    color: #e28b9b;
                }

                .status-open {
                    background: #1c2945;
                    color: #a9b9ff;
                }

                .detail-score {
                    min-width: 130px;
                    height: 130px;
                    border-radius: 50%;
                    background: #1a2340;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .detail-score strong {
                    font-size: 40px;
                    color: #9ca8ff;
                }

                .detail-score span {
                    color: #78869f;
                    font-size: 12px;
                }

                .detail-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 22px;
                }

                .detail-tags span {
                    padding: 7px 10px;
                    border-radius: 7px;
                    background: #1b2435;
                    color: #aebcff;
                    font-size: 11px;
                    text-transform: uppercase;
                }

                .detail-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                    gap: 18px;
                    margin-top: 25px;
                }

                .detail-card {
                    padding: 25px;
                    border: 1px solid #293246;
                    border-radius: 16px;
                    background: #111722;
                }

                .detail-card h2 {
                    margin-top: 0;
                    font-size: 19px;
                }

                .metric {
                    display: flex;
                    justify-content: space-between;
                    gap: 20px;
                    padding: 13px 0;
                    border-bottom: 1px solid #202938;
                }

                .metric:last-child {
                    border-bottom: 0;
                }

                .metric span {
                    color: #8190aa;
                }

                .metric strong {
                    text-align: right;
                }

                .hardware-value {
                    color: #aebbd0;
                    line-height: 1.7;
                }

                .best-for {
                    margin-top: 18px;
                }

                .best-for p {
                    color: #9caac0;
                    line-height: 1.7;
                }

                .recommendation-points {
                    display: grid;
                    grid-template-columns:
                        repeat(4, minmax(0, 1fr));
                    gap: 12px;
                    margin-top: 20px;
                }

                .recommendation-points div {
                    padding: 15px;
                    background: #0d121c;
                    border-radius: 10px;
                }

                .recommendation-points strong,
                .recommendation-points span {
                    display: block;
                }

                .recommendation-points strong {
                    color: #7f8da7;
                    font-size: 12px;
                }

                .recommendation-points span {
                    margin-top: 6px;
                }

                .use-case-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .use-case-list span {
                    padding: 8px 11px;
                    border-radius: 8px;
                    background: #0d121c;
                    color: #b5c2d8;
                    font-size: 13px;
                }

                .detail-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 25px;
                }

                .official-button,
                .secondary-button {
                    padding: 13px 18px;
                    border-radius: 9px;
                    text-decoration: none;
                    font-weight: 700;
                }

                .official-button {
                    background: #7d8bff;
                    color: white;
                }

                .secondary-button {
                    border: 1px solid #303b52;
                    color: #b5c1d6;
                }

                .detail-footer {
                    border-top: 1px solid #202738;
                    padding: 25px 7%;
                    display: flex;
                    justify-content: space-between;
                    color: #7f8da7;
                }

                @media (max-width: 700px) {

                    .detail-hero {
                        flex-direction: column;
                    }

                    .detail-hero h1 {
                        font-size: 34px;
                    }

                    .detail-grid {
                        grid-template-columns: 1fr;
                    }

                    .recommendation-points {
                        grid-template-columns:
                            repeat(2, 1fr);
                    }

                    .detail-actions {
                        flex-direction: column;
                    }

                    .detail-footer {
                        flex-direction: column;
                        gap: 10px;
                    }

                }

            </style>
        `;

    } catch (error) {

        document.body.innerHTML = `
            <div style="
                min-height:100vh;
                background:#080b12;
                color:white;
                display:grid;
                place-items:center;
                font-family:system-ui;
                text-align:center;
                padding:30px;
            ">

                <div>

                    <h1>Model not found</h1>

                    <p style="color:#9caac0">
                        ${escapeHtml(error.message)}
                    </p>

                    <a
                        href="/"
                        style="color:#8d9aff"
                    >
                        ← Return to EPRAT AI
                    </a>

                </div>

            </div>
        `;

    }
}


/* =====================================================
   RECOMMENDER
===================================================== */

function createRecommendationUI() {

    if (
        document.getElementById(
            "eprat-recommend"
        )
    ) {
        return;
    }

    if (!modelGrid) {
        return;
    }

    const panel =
        document.createElement("section");

    panel.id =
        "eprat-recommend";

    panel.innerHTML = `

        <div class="recommend-inner">

            <div class="recommend-label">
                EPRAT AI RECOMMENDER
            </div>

            <h2>
                Find the right AI for your task.
            </h2>

            <p>
                Tell EPRAT what you want to build,
                your budget, or your hardware.
                We'll rank the best matching models.
            </p>

            <div class="recommend-input-row">

                <input
                    id="recommendInput"
                    type="text"
                    placeholder="e.g. Best AI for coding on RTX 3050 8GB"
                >

                <button id="recommendButton">
                    Find AI
                </button>

            </div>

            <div class="recommend-examples">

                <button data-example="Best AI for coding">
                    Coding
                </button>

                <button data-example="Best AI for reasoning">
                    Reasoning
                </button>

                <button data-example="Best AI for local use">
                    Local AI
                </button>

                <button data-example="Best AI for RTX 3050 8GB">
                    RTX 3050 8GB
                </button>

                <button data-example="Best free AI">
                    Free AI
                </button>

            </div>

            <div id="recommendResults"></div>

        </div>
    `;


    const hero = document.querySelector(".hero");
    const modelsSection = modelGrid.parentElement;

    if (hero && modelsSection) {
        hero.parentElement.insertBefore(
            panel,
            modelsSection
        );
    } else {
        modelGrid.parentElement.insertBefore(
            panel,
            modelGrid
        );
    }


    /* =================================================
       RECOMMENDER CSS
    ================================================= */

    const style =
        document.createElement("style");

    style.textContent = `

        #eprat-recommend {
            margin-bottom: 55px;
        }

        .recommend-inner {
            padding: 30px;
            border: 1px solid #293246;
            border-radius: 18px;
            background:
                linear-gradient(
                    135deg,
                    #121827,
                    #0d111b
                );
        }

        .recommend-label {
            color: #8498ff;
            font-size: 11px;
            letter-spacing: 1.7px;
            font-weight: 700;
        }

        .recommend-inner h2 {
            margin: 8px 0;
            font-size: 30px;
        }

        .recommend-inner > .recommend-description,
        .recommend-inner > p {
            color: #8fa0bd;
            line-height: 1.6;
        }

        .recommend-input-row {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }

        #recommendInput {
            flex: 1;
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #303b52;
            background: #0d121d;
            color: white;
            font-size: 15px;
            outline: none;
        }

        #recommendInput:focus {
            border-color: #7b88ff;
        }

        #recommendButton {
            padding: 0 23px;
            border: 0;
            border-radius: 10px;
            background: #7b88ff;
            color: white;
            font-weight: 700;
            cursor: pointer;
        }

        #recommendButton:hover {
            background: #8b97ff;
        }

        .recommend-examples {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 14px;
        }

        .recommend-examples button {
            padding: 7px 11px;
            border-radius: 20px;
            border: 1px solid #303b52;
            background: #111827;
            color: #b9c6df;
            cursor: pointer;
        }

        .recommend-examples button:hover {
            border-color: #6877e9;
            color: white;
        }

        #recommendResults {
            margin-top: 25px;
        }

        .recommend-summary {
            color: #9eacc5;
            margin-bottom: 14px;
        }

        .recommend-summary strong {
            color: white;
        }

        .best-match-card {
            position: relative;
            padding: 24px;
            border: 1px solid #5363c8;
            border-radius: 16px;
            background:
                linear-gradient(
                    135deg,
                    #171e38,
                    #101622
                );
            margin-bottom: 18px;
            overflow: hidden;
        }

        .best-match-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: #7b88ff;
        }

        .best-match-label {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            border-radius: 20px;
            background: #222c58;
            color: #b9c3ff;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .6px;
            text-transform: uppercase;
        }

        .best-match-top {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-top: 15px;
        }

        .best-match-name {
            font-size: 25px;
            font-weight: 800;
        }

        .best-match-provider {
            color: #8492aa;
            margin-top: 5px;
        }

        .match-score-box {
            text-align: right;
            min-width: 100px;
        }

        .match-score-value {
            font-size: 28px;
            font-weight: 800;
            color: #aab4ff;
        }

        .match-score-label {
            color: #7e8aa3;
            font-size: 11px;
        }

        .recommend-status-row {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            margin-top: 14px;
        }

        .recommend-status {
            display: inline-flex;
            padding: 5px 9px;
            border-radius: 15px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
        }

        .recommend-status.status-current {
            background: #17342a;
            color: #7ce0ad;
        }

        .recommend-status.status-preview {
            background: #352e18;
            color: #e8c76c;
        }

        .recommend-status.status-legacy {
            background: #352026;
            color: #e28b9b;
        }

        .recommend-status.status-open {
            background: #1c2945;
            color: #a9b9ff;
        }

        .recommend-info-grid {
            display: grid;
            grid-template-columns:
                repeat(4, minmax(0, 1fr));
            gap: 9px;
            margin-top: 18px;
        }

        .recommend-info-item {
            padding: 12px;
            border-radius: 9px;
            background: #0d121d;
        }

        .recommend-info-item small {
            display: block;
            color: #718099;
            font-size: 10px;
            text-transform: uppercase;
        }

        .recommend-info-item strong {
            display: block;
            margin-top: 5px;
            color: #d9e0ef;
            font-size: 13px;
        }

        .hardware-good {
            color: #7ce0ad !important;
        }

        .hardware-possible {
            color: #e8c76c !important;
        }

        .hardware-warning {
            color: #e28b9b !important;
        }

        .hardware-neutral {
            color: #9eacc5 !important;
        }

        .recommend-section-title {
            color: #8d9ab2;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 20px 0 10px;
        }

        .reason-list,
        .warning-list {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            margin-top: 12px;
        }

        .reason-chip,
        .warning-chip {
            padding: 7px 9px;
            border-radius: 8px;
            font-size: 11px;
        }

        .reason-chip {
            background: #142b25;
            color: #8bd8b2;
        }

        .warning-chip {
            background: #322027;
            color: #dc9aa7;
        }

        .best-match-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 9px;
            margin-top: 20px;
        }

        .recommend-action {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 14px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 12px;
            font-weight: 700;
        }

        .recommend-primary {
            background: #7b88ff;
            color: white;
        }

        .recommend-secondary {
            border: 1px solid #303b52;
            color: #b9c6df;
        }

        .recommend-alternatives {
            display: grid;
            grid-template-columns:
                repeat(2, minmax(0, 1fr));
            gap: 10px;
        }

        .recommend-card {
            display: block;
            text-decoration: none;
            color: inherit;
            padding: 17px;
            border: 1px solid #283247;
            border-radius: 12px;
            background: #101622;
            transition:
                border-color .15s ease,
                transform .15s ease;
        }

        .recommend-card:hover {
            border-color: #5262b9;
            transform: translateY(-1px);
        }

        .recommend-card-top {
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }

        .recommend-rank {
            width: 30px;
            height: 30px;
            flex: 0 0 30px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: #1d2740;
            color: #9facff;
            font-weight: 700;
            font-size: 12px;
        }

        .recommend-main {
            min-width: 0;
            flex: 1;
        }

        .recommend-main strong {
            display: block;
            color: #f2f4f9;
        }

        .recommend-provider {
            color: #8290a8;
            font-size: 12px;
            margin-top: 3px;
        }

        .recommend-reason {
            color: #9eacc5;
            font-size: 12px;
            line-height: 1.5;
            margin-top: 10px;
        }

        .alternative-score {
            color: #9facff;
            font-size: 16px;
            font-weight: 800;
            white-space: nowrap;
        }

        .alternative-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 12px;
        }

        .alternative-meta span {
            padding: 5px 7px;
            border-radius: 6px;
            background: #0b1019;
            color: #8794aa;
            font-size: 10px;
        }

        .recommend-loading {
            padding: 18px;
            border: 1px solid #283247;
            border-radius: 12px;
            color: #9eacc5;
            background: #101622;
        }

        .recommend-error {
            padding: 18px;
            border: 1px solid #633642;
            border-radius: 12px;
            color: #e0a0ad;
            background: #21151a;
        }

        @media(max-width: 800px) {

            .recommend-info-grid {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

            .recommend-alternatives {
                grid-template-columns: 1fr;
            }

        }

        @media(max-width: 700px) {

            .recommend-input-row {
                flex-direction: column;
            }

            #recommendButton {
                height: 45px;
            }

            .best-match-top {
                flex-direction: column;
            }

            .match-score-box {
                text-align: left;
            }

            .recommend-info-grid {
                grid-template-columns: 1fr 1fr;
            }

        }

        @media(max-width: 480px) {

            .recommend-inner {
                padding: 20px;
            }

            .recommend-info-grid {
                grid-template-columns: 1fr;
            }

            .best-match-card {
                padding: 18px;
            }

        }

    `;

    document.head.appendChild(style);


    const input =
        document.getElementById(
            "recommendInput"
        );

    const button =
        document.getElementById(
            "recommendButton"
        );


    button.addEventListener(
        "click",
        runRecommendation
    );


    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                runRecommendation();
            }

        }
    );


    document
        .querySelectorAll(
            "[data-example]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    input.value =
                        button.dataset.example;

                    runRecommendation();

                }
            );

        });
}


/* =====================================================
   RECOMMENDATION CARD RENDERING
===================================================== */

function renderReasonChips(
    reasons = []
) {

    if (!reasons.length) {
        return "";
    }

    return `
        <div class="reason-list">

            ${reasons
                .map(reason =>
                    `<span class="reason-chip">
                        ✓ ${escapeHtml(reason)}
                    </span>`
                )
                .join("")}

        </div>
    `;
}


function renderWarningChips(
    warnings = []
) {

    if (!warnings.length) {
        return "";
    }

    return `
        <div class="warning-list">

            ${warnings
                .map(warning =>
                    `<span class="warning-chip">
                        ⚠ ${escapeHtml(warning)}
                    </span>`
                )
                .join("")}

        </div>
    `;
}


function renderRecommendationStatus(
    model
) {

    const status =
        model.status || "current";

    return `
        <div class="recommend-status-row">

            <span class="
                recommend-status
                ${getStatusClass(status)}
            ">
                ${getStatusLabel(status)}
            </span>

            ${
                model.open_weights
                    ? `
                        <span class="
                            recommend-status
                            status-open
                        ">
                            Open Weights
                        </span>
                      `
                    : ""
            }

            ${
                model.ollama
                    ? `
                        <span class="
                            recommend-status
                            status-open
                        ">
                            Ollama
                        </span>
                      `
                    : ""
            }

            ${
                (
                    model.video_generation === true ||
                    model.category?.includes("video")
                )
                    ? `
                        <span class="
                            recommend-status
                            status-open
                        ">
                            Video Generation
                        </span>
                      `
                    : ""
            }

        </div>
    `;
}


function renderBestMatch(
    model,
    hardware
) {

    const hardwareScore =
        model.hardware_match;

    const hardwareLabel =
        getHardwareLabel(
            hardwareScore
        );

    const hardwareClass =
        getHardwareClass(
            hardwareScore
        );

    return `

        <div class="best-match-card">

            <div class="best-match-label">
                🏆 Best Match
            </div>


            <div class="best-match-top">

                <div>

                    <div class="best-match-name">
                        ${escapeHtml(model.name)}
                    </div>

                    <div class="best-match-provider">
                        ${escapeHtml(model.provider)}
                    </div>

                    ${renderRecommendationStatus(model)}

                </div>


                <div class="match-score-box">

                    <div class="match-score-value">
                        ${escapeHtml(model.match_score)}
                    </div>

                    <div class="match-score-label">
                        EPRAT Match Score
                    </div>

                </div>

            </div>


            <div class="recommend-info-grid">

                <div class="recommend-info-item">

                    <small>Coding</small>

                    <strong>
                        ${model.coding ?? "—"}/100
                    </strong>

                </div>


                <div class="recommend-info-item">

                    <small>Reasoning</small>

                    <strong>
                        ${model.reasoning ?? "—"}/100
                    </strong>

                </div>


                <div class="recommend-info-item">

                    <small>Hardware</small>

                    <strong class="${hardwareClass}">
                        ${escapeHtml(hardwareLabel)}
                    </strong>

                </div>


                <div class="recommend-info-item">

                    <small>Access</small>

                    <strong>
                        ${escapeHtml(
                            getFreeLabel(model)
                        )}
                    </strong>

                </div>

            </div>


            ${
                hardware &&
                hardware.vram_gb
                    ? `
                        <div class="recommend-section-title">
                            Hardware Analysis
                        </div>

                        <div class="recommend-reason">
                            EPRAT detected
                            ${escapeHtml(
                                hardware.gpu ||
                                "your GPU"
                            )}
                            with
                            ${escapeHtml(
                                hardware.vram_gb
                            )}GB VRAM.
                        </div>
                      `
                    : ""
            }


            ${
                model.recommendation_reasons?.length
                    ? `
                        <div class="recommend-section-title">
                            Why EPRAT recommends it
                        </div>

                        ${renderReasonChips(
                            model.recommendation_reasons
                        )}
                      `
                    : ""
            }


            ${
                model.recommendation_warnings?.length
                    ? `
                        <div class="recommend-section-title">
                            Things to consider
                        </div>

                        ${renderWarningChips(
                            model.recommendation_warnings
                        )}
                      `
                    : ""
            }


            <div class="best-match-actions">

                <a
                    href="/models/${encodeURIComponent(model.id)}"
                    class="
                        recommend-action
                        recommend-primary
                    "
                >
                    View Model
                </a>

                ${
                    model.official
                        ? `
                            <a
                                href="${escapeHtml(
                                    model.official
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="
                                    recommend-action
                                    recommend-secondary
                                "
                            >
                                Official Page ↗
                            </a>
                          `
                        : ""
                }

            </div>

        </div>
    `;
}


function renderAlternative(
    model,
    index
) {

    const hardwareScore =
        model.hardware_match;

    return `

        <a
            href="/models/${encodeURIComponent(model.id)}"
            class="recommend-card"
        >

            <div class="recommend-card-top">

                <div class="recommend-rank">
                    ${index + 1}
                </div>


                <div class="recommend-main">

                    <strong>
                        ${escapeHtml(model.name)}
                    </strong>

                    <div class="recommend-provider">
                        ${escapeHtml(model.provider)}
                    </div>

                </div>


                <div class="alternative-score">
                    ${escapeHtml(
                        model.match_score
                    )}
                </div>

            </div>


            <div class="recommend-reason">

                ${escapeHtml(
                    model.recommendation_reasons?.[0] ||
                    "Strong alternative for this request."
                )}

            </div>


            <div class="alternative-meta">

                <span>
                    Coding ${model.coding ?? "—"}
                </span>

                <span>
                    Reasoning ${model.reasoning ?? "—"}
                </span>

                <span>
                    ${model.local
                        ? "Local"
                        : "Cloud"}
                </span>

                ${
                    model.ollama
                        ? "<span>Ollama</span>"
                        : ""
                }

                ${
                    hardwareScore !== null &&
                    hardwareScore !== undefined
                        ? `
                            <span class="${
                                getHardwareClass(
                                    hardwareScore
                                )
                            }">
                                Hardware ${
                                    hardwareScore
                                }/100
                            </span>
                          `
                        : ""
                }

            </div>

        </a>
    `;
}


/* =====================================================
   RUN RECOMMENDATION
===================================================== */

async function runRecommendation() {

    const input =
        document.getElementById(
            "recommendInput"
        );

    const results =
        document.getElementById(
            "recommendResults"
        );

    const query =
        input.value.trim();


    if (!query) {
        return;
    }


    results.innerHTML = `
        <div class="recommend-loading">
            Finding the best AI models...
        </div>
    `;


    try {

        const response = await fetch(
            `${API}/recommend?q=${encodeURIComponent(
                query
            )}&limit=5`,
            {
                cache: "no-store"
            }
        );


        if (!response.ok) {

            throw new Error(
                `Recommendation API returned ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !data.results ||
            !data.results.length
        ) {

            results.innerHTML = `
                <div class="recommend-error">
                    No matching AI models were found.
                </div>
            `;

            return;
        }


        const best =
            data.results[0];

        const alternatives =
            data.results.slice(1);


        results.innerHTML = `

            <div class="recommend-summary">

                Top matches for:
                <strong>
                    ${escapeHtml(query)}
                </strong>

            </div>


            ${renderBestMatch(
                best,
                data.hardware || {}
            )}


            ${
                alternatives.length
                    ? `
                        <div class="recommend-section-title">
                            Other good choices
                        </div>

                        <div class="recommend-alternatives">

                            ${alternatives
                                .map(
                                    (model, index) =>
                                        renderAlternative(
                                            model,
                                            index + 1
                                        )
                                )
                                .join("")}

                        </div>
                      `
                    : ""
            }

        `;

    } catch (error) {

        results.innerHTML = `
            <div class="recommend-error">
                ${escapeHtml(error.message)}
            </div>
        `;

    }
}


/* =====================================================
   MODEL DIRECTORY
===================================================== */

async function loadModels(
    query = "",
    category = ""
) {

    if (!modelGrid) {

        console.error(
            "EPRAT: model-grid element not found"
        );

        return;
    }


    modelGrid.innerHTML =
        '<div class="loading">Loading models...</div>';


    try {

        const params =
            new URLSearchParams();


        if (query) {
            params.set("q", query);
        }


        if (category) {
            params.set("category", category);
        }


        const response = await fetch(
            `${API}/models?${params.toString()}`,
            {
                cache: "no-store"
            }
        );


        if (!response.ok) {

            throw new Error(
                `API returned ${response.status}`
            );

        }


        const data =
            await response.json();


        if (modelCount) {

            modelCount.textContent =
                `${data.count} models`;

        }


        modelGrid.innerHTML =
            data.models
                .map(model => {

                    const status =
                        model.status ||
                        "current";

                    return `

                        <article class="model-card">

                            <a
                                href="/models/${encodeURIComponent(
                                    model.id
                                )}"
                                style="
                                    text-decoration:none;
                                    color:inherit;
                                    display:block;
                                "
                            >

                                <div class="model-top">

                                    <div>

                                        <h3>
                                            ${escapeHtml(
                                                model.name
                                            )}
                                        </h3>

                                        <div class="provider">
                                            ${escapeHtml(
                                                model.provider
                                            )}
                                        </div>

                                    </div>

                                    <div class="score">
                                        ${model.coding}
                                    </div>

                                </div>


                                <div style="
                                    display:flex;
                                    flex-wrap:wrap;
                                    gap:6px;
                                    margin:10px 0;
                                ">

                                    <span class="
                                        model-status
                                        ${getStatusClass(status)}
                                    ">
                                        ${getStatusLabel(
                                            status
                                        )}
                                    </span>

                                    ${
                                        model.ollama
                                            ? `
                                                <span class="
                                                    model-status
                                                    status-open
                                                ">
                                                    Ollama
                                                </span>
                                              `
                                            : ""
                                    }

                                    ${
                                        model.open_weights
                                            ? `
                                                <span class="
                                                    model-status
                                                    status-open
                                                ">
                                                    Open Weights
                                                </span>
                                              `
                                            : ""
                                    }

                                </div>


                                <p>
                                    ${escapeHtml(
                                        model.description
                                    )}
                                </p>


                                <div class="tags">

                                    ${(model.category || [])
                                        .map(category =>
                                            `<span class="tag">
                                                ${escapeHtml(
                                                    category
                                                )}
                                            </span>`
                                        )
                                        .join("")}

                                </div>


                                <div class="spec-grid">

                                    <div>

                                        <small>
                                            Coding
                                        </small>

                                        <strong>
                                            ${model.coding}
                                        </strong>

                                    </div>


                                    <div>

                                        <small>
                                            Reasoning
                                        </small>

                                        <strong>
                                            ${model.reasoning}
                                        </strong>

                                    </div>


                                    <div>

                                        <small>
                                            Context
                                        </small>

                                        <strong>
                                            ${formatNumber(
                                                model.context
                                            )}
                                        </strong>

                                    </div>


                                    <div>

                                        <small>
                                            Local
                                        </small>

                                        <strong>
                                            ${model.local
                                                ? "Yes"
                                                : "Cloud"}
                                        </strong>

                                    </div>

                                </div>

                            </a>


                            <div class="model-actions">

    <label class="compare-select">
        <input
            type="checkbox"
            class="compare-checkbox"
            data-model-id="${escapeHtml(model.id)}"
            onchange="toggleCompareModel(this)"
        >
        Compare
    </label>

    <a
        href="${escapeHtml(
            model.official
        )}"
        target="_blank"
        rel="noopener noreferrer"
    >
        Official ↗
    </a>

</div>

                        </article>
                    `;

                })
                .join("");


    } catch (error) {

        console.error(
            "EPRAT model loading error:",
            error
        );


        modelGrid.innerHTML = `
            <div class="loading">

                Unable to load models.

                <br>

                <small>
                    ${escapeHtml(
                        error.message
                    )}
                </small>

            </div>
        `;
    }
}

/* =====================================================
   MODEL COMPARISON
===================================================== */

const selectedCompareModels = new Set();

async function toggleCompareModel(checkbox) {

    const modelId = checkbox.dataset.modelId;

    if (!modelId) {
        return;
    }

    if (checkbox.checked) {

        if (selectedCompareModels.size >= 4) {
            checkbox.checked = false;
            alert("You can compare up to 4 models at a time.");
            return;
        }

        selectedCompareModels.add(modelId);

    } else {

        selectedCompareModels.delete(modelId);

    }

    await updateComparison();
}


function getComparisonBestClass(models, model, key, lowerIsBetter = false) {

    const values = models
        .map(item => item[key])
        .filter(value =>
            value !== null &&
            value !== undefined &&
            value !== "" &&
            Number.isFinite(Number(value))
        )
        .map(value => Number(value));

    if (!values.length) {
        return "";
    }

    const bestValue = lowerIsBetter
        ? Math.min(...values)
        : Math.max(...values);

    return Number(model[key]) === bestValue
        ? " comparison-best"
        : "";
}


function getComparisonBooleanClass(models, model, key) {

    const hasPositive = models.some(
        item => Boolean(item[key])
    );

    return hasPositive && Boolean(model[key])
        ? " comparison-best"
        : "";
}

async function updateComparison() {

    const comparison = document.getElementById("comparison");

    if (!comparison) {
        return;
    }

    if (selectedCompareModels.size === 0) {

        comparison.innerHTML = `
            <div class="empty">
                Select models above to compare.
            </div>
        `;

        return;
    }

    comparison.innerHTML = `
        <div class="loading">
            Loading comparison...
        </div>
    `;

    try {

        const response = await fetch(
            `${API}/compare`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(
                    Array.from(selectedCompareModels)
                )
            }
        );

        if (!response.ok) {
            throw new Error(
                `Comparison API returned ${response.status}`
            );
        }

        const data = await response.json();

        if (!data.models || data.models.length === 0) {

            comparison.innerHTML = `
                <div class="empty">
                    No models selected.
                </div>
            `;

            return;
        }

        comparison.innerHTML = `
            <div class="comparison-grid">
                ${data.models.map(model => `
                    <article class="comparison-card">

                        <h3>
                            ${escapeHtml(model.name)}
                        </h3>

                        <div class="provider">
                            ${escapeHtml(model.provider)}
                        </div>

                        <div class="compare-row">
                            <span>Coding</span>
                            <strong class="${getComparisonBestClass(data.models, model, "coding")}">${model.coding ?? "—"}</strong>
                        </div>

                        <div class="compare-row">
                            <span>Reasoning</span>
                            <strong class="${getComparisonBestClass(data.models, model, "reasoning")}">${model.reasoning ?? "—"}</strong>
                        </div>

                        <div class="compare-row">
                            <span>Context</span>
                            <strong class="${getComparisonBestClass(data.models, model, "context")}">${formatNumber(model.context)}</strong>
                        </div>

                        <div class="compare-row">
                            <span>Local</span>
                            <strong class="${getComparisonBooleanClass(data.models, model, "local")}">${model.local ? "Yes" : "Cloud"}</strong>
                        </div>

                        <div class="compare-row">
                            <span>Ollama</span>
                            <strong class="${getComparisonBooleanClass(data.models, model, "ollama")}">${model.ollama ? "Yes" : "No"}</strong>
                        </div>

                        <div class="compare-row">
                            <span>Open Weights</span>
                            <strong class="${getComparisonBooleanClass(data.models, model, "open_weights")}">${model.open_weights ? "Yes" : "No"}</strong>
                        </div>

                        <div class="compare-row">
                            <span>Input / 1M</span>
                            <strong class="${getComparisonBestClass(data.models, model, "input_price_per_1m", true)}">${formatPrice(model.input_price_per_1m)}</strong>
                        </div>

                        <div class="compare-row">
                            <span>Output / 1M</span>
                            <strong class="${getComparisonBestClass(data.models, model, "output_price_per_1m", true)}">${formatPrice(model.output_price_per_1m)}</strong>
                        </div>

                        <a
                            class="comparison-link"
                            href="/models/${encodeURIComponent(model.id)}"
                        >
                            View model →
                        </a>

                    </article>
                `).join("")}
            </div>
        `;

    } catch (error) {

        console.error(
            "EPRAT comparison error:",
            error
        );

        comparison.innerHTML = `
            <div class="empty">
                Unable to load comparison.
                <br>
                <small>
                    ${escapeHtml(error.message)}
                </small>
            </div>
        `;
    }
}




/* =====================================================
   CATEGORY FILTERS
===================================================== */

if (
    searchButton &&
    searchInput
) {

    searchButton.addEventListener(
        "click",
        () =>
            loadModels(
                searchInput.value.trim()
            )
    );


    searchInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                loadModels(
                    searchInput.value.trim()
                );

            }

        }
    );
}


document
    .querySelectorAll(
        "[data-category]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () =>
                loadModels(
                    "",
                    button.dataset.category
                )
        );

    });


/* =====================================================
   ROUTER
===================================================== */

const path =
    window.location.pathname;


if (
    path.startsWith("/models/")
) {

    const modelId =
        decodeURIComponent(
            path.substring(
                "/models/".length
            )
        );

    loadModelDetail(
        modelId
    );

} else {

    createRecommendationUI();

    loadModels();

}









