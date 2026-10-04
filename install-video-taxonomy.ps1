$ErrorActionPreference = "Stop"

cd "D:\EPRAT\eprat-ai"

$dataPath = ".\backend\data\models.json"
$backupPath = ".\backend\data\models.before-video-taxonomy-safe.json"

Write-Host "EPRAT AI Video Taxonomy Installer" -ForegroundColor Cyan
Write-Host ""

# Load catalogue
$models = Get-Content $dataPath -Raw | ConvertFrom-Json

Write-Host "Existing models: $($models.Count)" -ForegroundColor Yellow

if ($models.Count -ne 12) {
    throw "Expected exactly 12 existing models. Found $($models.Count). No changes made."
}

# Safety backup
Copy-Item $dataPath $backupPath -Force
Write-Host "Safety backup created." -ForegroundColor Green

# Add taxonomy fields to existing models
foreach ($model in $models) {
    $model | Add-Member -NotePropertyName video_generation -NotePropertyValue $false -Force
    $model | Add-Member -NotePropertyName video_score -NotePropertyValue 0 -Force
    $model | Add-Member -NotePropertyName image_generation -NotePropertyValue $false -Force
    $model | Add-Member -NotePropertyName audio_generation -NotePropertyValue $false -Force
}

# Video models
$videoModels = @(
    [PSCustomObject]@{
        id="veo-3.1"
        name="Veo 3.1"
        provider="Google"
        category=@("video","multimodal")
        coding=0
        reasoning=80
        multimodal=$true
        local=$false
        ollama=$false
        open_weights=$false
        license="Proprietary"
        context=128000
        extended_context=$false
        max_output=0
        input_price_per_1m=0
        cached_input_price_per_1m=0
        output_price_per_1m=0
        api_free_tier=$false
        consumer_free=$false
        parameters="N/A"
        active_parameters="N/A"
        hardware=@()
        description="Google video generation model supporting text-to-video and image-to-video generation."
        use_cases=@("text to video","image to video","video generation")
        official="https://ai.google.dev/gemini-api/docs/video"
        last_verified="2026-10-04"
        status="preview"
        video_generation=$true
        video_score=99
        image_generation=$false
        audio_generation=$true
    },
    [PSCustomObject]@{
        id="runway-gen-4.5"
        name="Runway Gen-4.5"
        provider="Runway"
        category=@("video","multimodal")
        coding=0
        reasoning=75
        multimodal=$true
        local=$false
        ollama=$false
        open_weights=$false
        license="Proprietary"
        context=0
        extended_context=$false
        max_output=0
        input_price_per_1m=0
        cached_input_price_per_1m=0
        output_price_per_1m=0
        api_free_tier=$false
        consumer_free=$false
        parameters="N/A"
        active_parameters="N/A"
        hardware=@()
        description="Runway video generation model for text-to-video and image-to-video creation."
        use_cases=@("text to video","image to video","video generation")
        official="https://help.runwayml.com/hc/en-us/articles/46974685288467-Creating-with-Gen-4-5"
        last_verified="2026-10-04"
        status="current"
        video_generation=$true
        video_score=98
        image_generation=$false
        audio_generation=$false
    },
    [PSCustomObject]@{
        id="luma-ray3.2"
        name="Luma Ray3.2"
        provider="Luma AI"
        category=@("video","multimodal")
        coding=0
        reasoning=75
        multimodal=$true
        local=$false
        ollama=$false
        open_weights=$false
        license="Proprietary"
        context=0
        extended_context=$false
        max_output=0
        input_price_per_1m=0
        cached_input_price_per_1m=0
        output_price_per_1m=0
        api_free_tier=$false
        consumer_free=$false
        parameters="N/A"
        active_parameters="N/A"
        hardware=@()
        description="Luma AI video generation model supporting text-to-video, image-to-video and video editing."
        use_cases=@("text to video","image to video","video editing","animation")
        official="https://lumalabs.ai/ray"
        last_verified="2026-10-04"
        status="current"
        video_generation=$true
        video_score=97
        image_generation=$false
        audio_generation=$false
    },
    [PSCustomObject]@{
        id="gemini-omni-flash-1.1"
        name="Gemini Omni Flash 1.1"
        provider="Google"
        category=@("video","multimodal")
        coding=0
        reasoning=82
        multimodal=$true
        local=$false
        ollama=$false
        open_weights=$false
        license="Proprietary"
        context=1000000
        extended_context=$true
        max_output=0
        input_price_per_1m=0
        cached_input_price_per_1m=0
        output_price_per_1m=0
        api_free_tier=$false
        consumer_free=$false
        parameters="N/A"
        active_parameters="N/A"
        hardware=@()
        description="Multimodal generation model supporting video creation and transformation workflows."
        use_cases=@("text to video","image to video","video generation","video editing")
        official="https://ai.google.dev/gemini-api/docs/omni"
        last_verified="2026-10-04"
        status="current"
        video_generation=$true
        video_score=96
        image_generation=$false
        audio_generation=$false
    }
)

$finalModels = @($models) + @($videoModels)

Write-Host "Final models: $($finalModels.Count)" -ForegroundColor Yellow

if ($finalModels.Count -ne 16) {
    throw "Final catalogue must contain exactly 16 models."
}

# Check duplicate IDs
$duplicates = $finalModels |
    Group-Object id |
    Where-Object Count -gt 1

if ($duplicates) {
    throw "Duplicate model IDs detected."
}

# Write catalogue
$finalModels |
    ConvertTo-Json -Depth 20 |
    Set-Content $dataPath -Encoding UTF8

Write-Host ""
Write-Host "SUCCESS - Video taxonomy installed." -ForegroundColor Green
Write-Host "Total models: $($finalModels.Count)" -ForegroundColor Green
Write-Host ""

$finalModels |
    Where-Object video_generation -eq $true |
    Select-Object id,name,video_generation,video_score,status |
    Format-Table -AutoSize

Write-Host ""
Write-Host "Backup: $backupPath" -ForegroundColor Cyan

