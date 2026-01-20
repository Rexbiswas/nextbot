$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
$files = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1"
)
$outputDir = "public\models"

foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $output = "$outputDir\$file"
    Write-Host "Downloading $file..."
    Invoke-WebRequest -Uri $url -OutFile $output
}
Write-Host "All models downloaded."
