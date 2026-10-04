import json
import re
from pathlib import Path

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse


# =======================================================
# PATHS
# =======================================================

BASE_DIR = Path(__file__).resolve().parents[2]

DATA_FILE = BASE_DIR / "backend" / "data" / "models.json"
FRONTEND_DIR = BASE_DIR / "frontend"


# =======================================================
# LOAD MODEL CATALOGUE
# =======================================================

with open(DATA_FILE, "r", encoding="utf-8-sig") as f:
    MODELS = json.load(f)


# =======================================================
# FASTAPI
# =======================================================

app = FastAPI(
    title="EPRAT AI",
    version="1.5"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =======================================================
# STATIC FRONTEND
# =======================================================

@app.get("/style.css")
def style():
    return FileResponse(FRONTEND_DIR / "style.css")


@app.get("/app.js")
def javascript():
    return FileResponse(FRONTEND_DIR / "app.js")


@app.get("/favicon.ico")
def favicon():

    favicon_file = FRONTEND_DIR / "favicon.ico"

    if favicon_file.exists():
        return FileResponse(favicon_file)

    return {"status": "no favicon"}


# =======================================================
# HEALTH
# =======================================================

@app.get("/api/health")
def health():

    return {
        "status": "ok",
        "models": len(MODELS),
        "version": "1.5"
    }


# =======================================================
# MODEL DIRECTORY
# =======================================================

@app.get("/api/models")
def models(
    q: str = "",
    category: str = ""
):

    q = q.lower().strip()
    category = category.lower().strip()

    result = MODELS

    # ---------------------------------------------------
    # Category filter
    # ---------------------------------------------------

    if category:

        result = [
            model
            for model in result
            if category in [
                item.lower()
                for item in model.get("category", [])
            ]
        ]

    # ---------------------------------------------------
    # Search filter
    # ---------------------------------------------------

    if q:

        result = [
            model
            for model in result
            if q in (
                model.get("name", "")
                + " "
                + model.get("provider", "")
                + " "
                + model.get("description", "")
                + " "
                + " ".join(model.get("category", []))
            ).lower()
        ]

    return {
        "count": len(result),
        "models": result
    }


# =======================================================
# MODEL DETAILS
# =======================================================

@app.get("/api/models/{model_id}")
def model_detail(model_id: str):

    for model in MODELS:

        if model["id"] == model_id:
            return model

    return {
        "error": "Model not found"
    }


# =======================================================
# HELPERS
# =======================================================

def contains_any(text: str, words: list[str]) -> bool:

    return any(
        word in text
        for word in words
    )


# =======================================================
# VRAM DETECTION
# =======================================================

def get_vram(text: str):

    """
    Extract VRAM from queries such as:

        RTX 3050 8GB
        8GB VRAM
        12 GB GPU
        16gb

    Returns GB or None.
    """

    patterns = [

        r"(\d+)\s*gb\s*(?:vram|gpu|graphics|memory)?",

        r"(?:rtx|gpu)\s*\d+\s*(\d+)\s*gb",

        r"(\d+)\s*gb"
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text
        )

        if match:

            try:
                return int(
                    match.group(1)
                )

            except ValueError:
                pass

    return None


# =======================================================
# GPU DETECTION
# =======================================================

def get_gpu_name(text: str):

    gpu_patterns = [

        r"rtx\s*3050",
        r"rtx\s*3060",
        r"rtx\s*3070",
        r"rtx\s*3080",
        r"rtx\s*3090",

        r"rtx\s*4060",
        r"rtx\s*4070",
        r"rtx\s*4080",
        r"rtx\s*4090",

        r"rtx\s*5050",
        r"rtx\s*5060",
        r"rtx\s*5070",
        r"rtx\s*5080",
        r"rtx\s*5090",
    ]

    for pattern in gpu_patterns:

        match = re.search(
            pattern,
            text
        )

        if match:
            return match.group(0).upper()

    return None


# =======================================================
# FREE MODEL DETECTION
# =======================================================

def is_free_model(model: dict) -> bool:

    """
    A model is considered free if:

    - API free tier is available
    - Consumer free access is available
    - Local open-weight inference is available

    Local inference still requires the user to obtain
    and run the model themselves.
    """

    if model.get("api_free_tier") is True:
        return True

    if model.get("consumer_free") is True:
        return True

    if (
        model.get("local") is True
        and model.get("open_weights") is True
    ):
        return True

    return False


# =======================================================
# LOCAL HARDWARE SCORE
# =======================================================

def local_hardware_score(
    model: dict,
    vram
):

    """
    Approximate hardware suitability.

    This is intentionally conservative.

    We do NOT claim exact VRAM requirements unless
    the catalogue explicitly provides hardware information.
    """

    if not model.get("local"):
        return 0

    parameters = model.get("parameters")

    if not parameters:

        if vram is None:
            return 35

        return 35

    billions = (
        parameters /
        1_000_000_000
    )

    # ---------------------------------------------------
    # No VRAM supplied
    # ---------------------------------------------------

    if vram is None:

        if billions <= 8:
            return 80

        if billions <= 14:
            return 60

        if billions <= 22:
            return 40

        return 20

    # ---------------------------------------------------
    # <= 8B
    # ---------------------------------------------------

    if billions <= 8:

        if vram >= 8:
            return 100

        if vram >= 6:
            return 80

        return 40

    # ---------------------------------------------------
    # <= 14B
    # ---------------------------------------------------

    if billions <= 14:

        if vram >= 16:
            return 90

        if vram >= 12:
            return 75

        if vram >= 8:
            return 50

        return 20

    # ---------------------------------------------------
    # <= 22B
    # ---------------------------------------------------

    if billions <= 22:

        if vram >= 24:
            return 90

        if vram >= 16:
            return 75

        if vram >= 12:
            return 55

        if vram >= 8:
            return 25

        return 10

    # ---------------------------------------------------
    # <= 35B
    # ---------------------------------------------------

    if billions <= 35:

        if vram >= 48:
            return 90

        if vram >= 24:
            return 70

        if vram >= 16:
            return 45

        if vram >= 12:
            return 20

        return 5

    # ---------------------------------------------------
    # 35B+
    # ---------------------------------------------------

    if vram >= 48:
        return 70

    if vram >= 24:
        return 40

    return 5


# =======================================================
# RECOMMENDER
# =======================================================

# =======================================================
# RECOMMENDER
# =======================================================

def general_capability_score(model: dict) -> float:
    """
    General-purpose capability used only when the user has not
    specified a narrow task. This deliberately avoids treating
    coding strength as the same thing as overall suitability.
    """
    coding = float(model.get("coding") or 0)
    reasoning = float(model.get("reasoning") or 0)
    multimodal = 100.0 if model.get("multimodal") else 0.0

    return (
        coding * 0.35
        + reasoning * 0.45
        + multimodal * 0.20
    )


def maturity_score(model: dict) -> float:
    """
    Recommendation maturity signal.

    Current models are preferred, previews receive a modest
    reduction, and legacy models receive a strong reduction.
    """
    status = model.get("status", "current")

    if status == "legacy":
        return 20.0

    if status == "preview":
        return 85.0

    return 100.0


def is_agentic_model(model: dict) -> bool:
    use_cases = [
        str(item).lower()
        for item in model.get("use_cases", [])
    ]

    description = str(
        model.get("description", "")
    ).lower()

    return (
        "agent" in use_cases
        or "agents" in use_cases
        or "agentic" in description
    )


def score_access(model: dict, access_key: str) -> float:
    """
    Return a 0-100 access score for local/Ollama/free queries.
    """
    if access_key == "local":
        return 100.0 if model.get("local") else 0.0

    if access_key == "ollama":
        return 100.0 if model.get("ollama") else 0.0

    if access_key == "free":
        return 100.0 if is_free_model(model) else 0.0

    if access_key == "open_weights":
        return 100.0 if model.get("open_weights") else 0.0

    return 0.0


@app.get("/api/recommend")
def recommend(
    q: str = Query(
        ...,
        min_length=1
    ),
    limit: int = Query(
        5,
        ge=1,
        le=20
    )
):

    text = q.lower().strip()

    # ===================================================
    # INTENT DETECTION
    # ===================================================

    wants_coding = contains_any(
        text,
        [
            "code",
            "coding",
            "developer",
            "programming",
            "python",
            "javascript",
            "typescript",
            "software",
            "programmer",
            "development"
        ]
    )

    wants_reasoning = contains_any(
        text,
        [
            "reason",
            "reasoning",
            "math",
            "research",
            "analysis",
            "complex",
            "logic",
            "problem solving"
        ]
    )

    wants_multimodal = contains_any(
        text,
        [
            "image",
            "vision",
            "photo",
            "pdf",
            "multimodal",
            "visual",
            "video analysis",
            "analyze video",
            "understand video"
        ]
    )

    wants_video = contains_any(
        text,
        [
            "video generation",
            "generate video",
            "generate a video",
            "create video",
            "create a video",
            "make video",
            "make a video",
            "text to video",
            "text-to-video",
            "image to video",
            "image-to-video",
            "video to video",
            "video-to-video",
            "ai video",
            "ai video generator",
            "video generator",
            "video generation",
            "animate image",
            "animate a photo",
            "animate picture"
        ]
    )

    wants_local = contains_any(
        text,
        [
            "local",
            "offline",
            "ollama",
            "private",
            "self host",
            "self-host",
            "self hosted",
            "self-hosted",
            "run on my pc",
            "run locally",
            "on my computer"
        ]
    )

    wants_ollama = contains_any(
        text,
        [
            "ollama"
        ]
    )

    wants_agentic = contains_any(
        text,
        [
            "agent",
            "agentic",
            "automation",
            "tool use",
            "tools",
            "mcp"
        ]
    )

    wants_free = contains_any(
        text,
        [
            "free",
            "no cost",
            "zero cost",
            "without paying",
            "budget",
            "cheap",
            "low cost",
            "cost effective"
        ]
    )

    # ===================================================
    # HARDWARE DETECTION
    # ===================================================

    vram = get_vram(text)
    gpu_name = get_gpu_name(text)

    wants_gpu = (
        vram is not None
        or gpu_name is not None
        or contains_any(
            text,
            [
                "gpu",
                "graphics card",
                "graphics",
                "vram"
            ]
        )
    )

    # ===================================================
    # DEFAULT INTENT
    # ===================================================

    if not any(
        [
            wants_coding,
            wants_reasoning,
            wants_multimodal,
            wants_video,
            wants_local,
            wants_agentic,
            wants_free,
            wants_gpu
        ]
    ):
        # A broad query should prefer general capability rather
        # than automatically becoming a coding + reasoning query.
        wants_reasoning = True

    # ===================================================
    # RANK MODELS
    # ===================================================

    ranked = []

    for model in MODELS:

        coding_score = float(model.get("coding") or 0)
        reasoning_score = float(model.get("reasoning") or 0)
        general_score = general_capability_score(model)
        maturity = maturity_score(model)

        hardware_score = (
            local_hardware_score(model, vram)
            if wants_gpu
            else None
        )

        score = 0.0
        reasons = []
        warnings = []
        breakdown = {}

        # =================================================
        # BUILD A QUERY-SPECIFIC WEIGHT PROFILE
        # =================================================

        if wants_gpu and wants_coding:
            # GPU + coding is a hardware-constrained coding decision.
            # Current models should beat legacy models when practical
            # hardware fit is otherwise comparable.
            weights = {
                "coding": 0.35,
                "local": 0.15,
                "hardware": 0.35,
                "maturity": 0.15,
            }

        elif wants_gpu:
            # Hardware-only queries prioritize practical hardware fit,
            # while still preferring current models over legacy models.
            weights = {
                "hardware": 0.45,
                "local": 0.20,
                "general": 0.20,
                "maturity": 0.15,
            }

        elif wants_coding:
            weights = {
                "coding": 0.65,
                "reasoning": 0.10,
                "maturity": 0.15,
                "general": 0.10,
            }

        elif wants_video:
            weights = {
                "video": 0.95,
                "maturity": 0.05,
            }

        elif wants_multimodal:
            weights = {
                "multimodal": 0.65,
                "reasoning": 0.10,
                "coding": 0.05,
                "maturity": 0.20,
            }

        elif wants_ollama:
            weights = {
                "ollama": 0.60,
                "local": 0.25,
                "general": 0.10,
                "maturity": 0.05,
            }

        elif wants_free:
            weights = {
                "free": 0.65,
                "general": 0.20,
                "maturity": 0.15,
            }

        elif wants_agentic:
            weights = {
                "agentic": 0.60,
                "reasoning": 0.15,
                "coding": 0.10,
                "maturity": 0.15,
            }

        elif wants_local:
            # Generic local requests intentionally use general
            # capability. Coding is not allowed to dominate merely
            # because a model is a coding specialist.
            weights = {
                "local": 0.35,
                "general": 0.35,
                "open_weights": 0.15,
                "ollama": 0.10,
                "maturity": 0.05,
            }

        elif wants_reasoning:
            weights = {
                "reasoning": 0.65,
                "coding": 0.10,
                "general": 0.10,
                "maturity": 0.15,
            }

        else:
            weights = {
                "general": 0.75,
                "maturity": 0.25,
            }

        # =================================================
        # SCORE COMPONENTS
        # =================================================

        if "coding" in weights:
            value = coding_score
            points = value * weights["coding"]
            score += points
            breakdown["coding"] = round(points, 1)

            if wants_coding and coding_score >= 90:
                reasons.append("strong coding capability")

        if "reasoning" in weights:
            value = reasoning_score
            points = value * weights["reasoning"]
            score += points
            breakdown["reasoning"] = round(points, 1)

            if wants_reasoning and reasoning_score >= 90:
                reasons.append("strong reasoning capability")

        if "video" in weights:
            video_enabled = bool(model.get("video_generation"))
            video_score = float(model.get("video_score") or 0)

            value = video_score if video_enabled else 0.0
            points = value * weights["video"]
            score += points
            breakdown["video"] = round(points, 1)

            if video_enabled:
                reasons.append("supports video generation")

                if video_score >= 95:
                    reasons.append("high video-generation capability")
            else:
                warnings.append("not a dedicated video-generation model")

        if "multimodal" in weights:
            value = 100.0 if model.get("multimodal") else 0.0
            points = value * weights["multimodal"]
            score += points
            breakdown["multimodal"] = round(points, 1)

            if model.get("multimodal"):
                reasons.append("supports multimodal workloads")
            else:
                warnings.append("not multimodal")

        if "local" in weights:
            value = score_access(model, "local")
            points = value * weights["local"]
            score += points
            breakdown["local"] = round(points, 1)

            if model.get("local"):
                reasons.append("available for local/self-hosted use")
            else:
                warnings.append("cloud/API only")

        if "ollama" in weights:
            value = score_access(model, "ollama")
            points = value * weights["ollama"]
            score += points
            breakdown["ollama"] = round(points, 1)

            if model.get("ollama"):
                reasons.append("available through Ollama")
            else:
                if wants_ollama:
                    warnings.append("not listed for Ollama")

        if "free" in weights:
            value = score_access(model, "free")
            points = value * weights["free"]
            score += points
            breakdown["free"] = round(points, 1)

            if is_free_model(model):
                reasons.append("free/local access available")
            else:
                warnings.append("paid access")

        if "open_weights" in weights:
            value = score_access(model, "open_weights")
            points = value * weights["open_weights"]
            score += points
            breakdown["open_weights"] = round(points, 1)

            if model.get("open_weights"):
                reasons.append("open-weight model")

        if "agentic" in weights:
            value = 100.0 if is_agentic_model(model) else 0.0
            points = value * weights["agentic"]
            score += points
            breakdown["agentic"] = round(points, 1)

            if is_agentic_model(model):
                reasons.append("suited to agentic workflows")

        if "hardware" in weights:
            value = float(hardware_score or 0)
            points = value * weights["hardware"]
            score += points
            breakdown["hardware"] = round(points, 1)

            if model.get("local"):
                if vram is not None:
                    if value >= 80:
                        reasons.append(
                            f"good estimated fit for {vram}GB VRAM"
                        )
                    elif value >= 50:
                        reasons.append(
                            f"possible fit with quantization/offloading on {vram}GB"
                        )
                    else:
                        warnings.append(
                            f"likely difficult on {vram}GB VRAM"
                        )
                else:
                    reasons.append(
                        "local hardware compatibility considered"
                    )
            else:
                warnings.append(
                    "GPU is unnecessary for cloud inference"
                )

        if "general" in weights:
            points = general_score * weights["general"]
            score += points
            breakdown["general"] = round(points, 1)

        if "maturity" in weights:
            points = maturity * weights["maturity"]
            score += points
            breakdown["maturity"] = round(points, 1)

            status = model.get("status", "current")

            if status == "legacy":
                warnings.append("legacy model")
            elif status == "preview":
                warnings.append("preview model")

        # =================================================
        # LEGACY MODEL GUARD
        # =================================================
        #
        # For hardware recommendations, a legacy model should
        # not outrank a suitable current model solely because
        # its smaller parameter count gives it a perfect
        # hardware score.
        #
        # Keep legacy models in the catalogue for comparison,
        # but reduce their recommendation ranking when GPU
        # hardware is part of the query.
        # =================================================

        if wants_gpu and model.get("status", "current") == "legacy":
            score *= 0.75
            warnings.append(
                "legacy model ranking reduced for hardware recommendation"
            )

        # =================================================
        # FINAL MODEL RECORD
        # =================================================

        item = dict(model)

        # match_score is now a genuine 0-100 weighted match score,
        # rather than the previous raw internal score divided by 10.
        item["match_score"] = round(
            max(0.0, min(score, 100.0)),
            1
        )

        item["score_breakdown"] = breakdown

        item["recommendation_reasons"] = list(
            dict.fromkeys(reasons)
        )[:6]

        item["recommendation_warnings"] = list(
            dict.fromkeys(warnings)
        )[:4]

        item["hardware_match"] = hardware_score

        ranked.append(
            (
                score,
                item
            )
        )

    # ===================================================
    # SORT
    # ===================================================

    ranked.sort(
        key=lambda x: x[0],
        reverse=True
    )

    results = [
        item
        for score, item in ranked[:limit]
    ]

    # ===================================================
    # RECOMMENDATION METADATA
    # ===================================================

    intent = []

    if wants_coding:
        intent.append("coding")

    if wants_reasoning:
        intent.append("reasoning")

    if wants_multimodal:
        intent.append("multimodal")

    if wants_video:
        intent.append("video_generation")

    if wants_local:
        intent.append("local")

    if wants_ollama:
        intent.append("ollama")

    if wants_free:
        intent.append("free")

    if wants_agentic:
        intent.append("agentic")

    if wants_gpu:
        intent.append("hardware")

    # ===================================================
    # RESPONSE
    # ===================================================

    return {
        "query": q,
        "intent": intent,
        "hardware": {
            "gpu": gpu_name,
            "vram_gb": vram
        },
        "results": results
    }


# =======================================================
# COMPARE
# =======================================================

@app.post("/api/compare")
def compare(
    ids: list[str]
):

    selected = [
        model
        for model in MODELS
        if model["id"] in ids
    ]

    return {
        "models": selected
    }


# =======================================================
# FRONTEND ROUTES
# =======================================================

@app.get("/")
def home():

    return FileResponse(
        FRONTEND_DIR / "index.html"
    )


@app.get("/models/{model_id}")
def model_page(
    model_id: str
):

    return FileResponse(
        FRONTEND_DIR / "index.html"
    )


# =======================================================
# SEO
# =======================================================

@app.get("/robots.txt")
def robots():

    return PlainTextResponse(
        "User-agent: *\n"
        "Allow: /\n"
        "Sitemap: https://epratai.com/sitemap.xml\n"
    )


@app.get("/sitemap.xml")
def sitemap():

    urls = [
        "https://epratai.com/"
    ]

    urls.extend(
        f"https://epratai.com/models/{model['id']}"
        for model in MODELS
    )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        + "".join(
            f"<url><loc>{url}</loc></url>"
            for url in urls
        )
        + "</urlset>"
    )

    return PlainTextResponse(
        xml,
        media_type="application/xml"
    )

# =======================================================
# FALLBACK
# =======================================================

@app.get("/{filename:path}")
def frontend(
    filename: str
):

    path = FRONTEND_DIR / filename

    if path.exists() and path.is_file():

        return FileResponse(path)

    return FileResponse(
        FRONTEND_DIR / "index.html"
    )





