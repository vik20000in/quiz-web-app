# Load the index.json file
$jsonFilePath = "c:/Users/vikra/quiz-web-app/data/index.json"
$jsonContent = Get-Content -Path $jsonFilePath -Raw | ConvertFrom-Json

# Function to check if a file exists
function Check-FileExists {
    param (
        [string]$filePath
    )
    return Test-Path -Path $filePath
}

# List to store missing files
$missingFiles = @()

# Iterate through the classes and categories to check file paths
foreach ($class in $jsonContent.classes.PSObject.Properties) {
    foreach ($category in $class.Value.categories) {
        foreach ($subcategory in $category.subcategories) {
            $filePath = Join-Path -Path "c:/Users/vikra/quiz-web-app/data" -ChildPath $subcategory.path
            if (-not (Check-FileExists -filePath $filePath)) {
                $missingFiles += $filePath
            }
        }
    }
}

# Print the result
if ($missingFiles.Count -gt 0) {
    Write-Output "The following files are missing:"
    foreach ($file in $missingFiles) {
        Write-Output $file
    }
} else {
    Write-Output "All files are present."
}