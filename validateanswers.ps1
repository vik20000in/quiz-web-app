param (
    [Parameter(Mandatory=$true)]
    [string]$Path
)

function Get-AIAnswer {
    param (
        [string]$Question
    )

    # Simulate AI answering by parsing and calculating
    try {
        # Remove "What is" prefix if present
        $expression = $Question -replace "^What is\s+", "" -replace "\?$", ""

        # Handle different operations
        if ($expression -match "(\d+)\s*\*\s*(\d+)") {
            return [int]$matches[1] * [int]$matches[2]
        }
        elseif ($expression -match "(\d+)\s*\+\s*(\d+)") {
            return [int]$matches[1] + [int]$matches[2]
        }
        elseif ($expression -match "(\d+)\s*-\s*(\d+)") {
            return [int]$matches[1] - [int]$matches[2]
        }
        elseif ($expression -match "(\d+)\s*/\s*(\d+)") {
            if ([int]$matches[2] -eq 0) { return "Division by zero" }
            return [int]$matches[1] / [int]$matches[2]
        }
        elseif ($expression -match "(\d+)\s*multiplied by\s*(\d+)") {
            return [int]$matches[1] * [int]$matches[2]
        }
        else {
            return "Unable to parse question"
        }
    }
    catch {
        return "Error calculating: $_"
    }
}

function Validate-JsonAnswers {
    param (
        [string]$FilePath
    )

    try {
        # Read and parse JSON file
        $jsonContent = Get-Content -Path $FilePath -Raw | ConvertFrom-Json
        $questions = $jsonContent.questions
        $errorsFound = @()

        # Process each question
        foreach ($q in $questions) {
            $questionText = $q.question
            $options = $q.options
            $answerIndex = switch ($q.answer) {
                "A" { 0 }
                "B" { 1 }
                "C" { 2 }
                "D" { 3 }
                default { -1 }
            }
            $explanation = $q.explanation
            $selectedAnswer = if ($answerIndex -ge 0 -and $answerIndex -lt $options.Count) { $options[$answerIndex] } else { "N/A" }

            # Get AI's answer
            $aiAnswer = Get-AIAnswer -Question $questionText

            # Validate
            if ($answerIndex -eq -1) {
                $errorsFound += [PSCustomObject]@{
                    File            = $FilePath
                    Question        = $questionText
                    Options         = $options -join ", "
                    SelectedAnswer  = $q.answer
                    Explanation     = $explanation
                    AIAnswer        = $aiAnswer
                    Error           = "Invalid answer index"
                }
            }
            elseif ($aiAnswer -eq "Unable to parse question" -or $aiAnswer -eq "Division by zero") {
                $errorsFound += [PSCustomObject]@{
                    File            = $FilePath
                    Question        = $questionText
                    Options         = $options -join ", "
                    SelectedAnswer  = "$($q.answer) ($selectedAnswer)"
                    Explanation     = $explanation
                    AIAnswer        = $aiAnswer
                    Error           = "AI couldn't process question"
                }
            }
            else {
                # Convert answers to comparable types
                $aiAnswerNum = try { [double]$aiAnswer } catch { $aiAnswer }
                $selectedAnswerNum = try { [double]$selectedAnswer } catch { $selectedAnswer }

                # Check if selected answer matches AI answer
                if ($selectedAnswerNum -ne $aiAnswerNum) {
                    $errorsFound += [PSCustomObject]@{
                        File            = $FilePath
                        Question        = $questionText
                        Options         = $options -join ", "
                        SelectedAnswer  = "$($q.answer) ($selectedAnswer)"
                        Explanation     = $explanation
                        AIAnswer        = $aiAnswer
                        Error           = "Answer mismatch"
                    }
                }

                # Check explanation
                if ($explanation -notmatch [regex]::Escape($aiAnswer.ToString())) {
                    $errorsFound += [PSCustomObject]@{
                        File            = $FilePath
                        Question        = $questionText
                        Options         = $options -join ", "
                        SelectedAnswer  = "$($q.answer) ($selectedAnswer)"
                        Explanation     = $explanation
                        AIAnswer        = $aiAnswer
                        Error           = "Explanation mismatch"
                    }
                }
            }
        }

        return $errorsFound
    }
    catch {
        Write-Error "Error processing file ${FilePath}: $_"
        return @()
    }
}

# Main processing
$allErrors = @()

if (Test-Path $Path) {
    $item = Get-Item $Path
    
    if ($item.PSIsContainer) {
        $jsonFiles = Get-ChildItem -Path $Path -File -Filter "*.json"
        foreach ($file in $jsonFiles) {
            Write-Host "Processing: $($file.FullName)"
            $errors = Validate-JsonAnswers -FilePath $file.FullName
            $allErrors += $errors
        }
    }
    else {
        Write-Host "Processing: $($item.FullName)"
        $errors = Validate-JsonAnswers -FilePath $item.FullName
        $allErrors += $errors
    }

    if ($allErrors.Count -eq 0) {
        Write-Host "No errors found in the provided JSON file(s)" -ForegroundColor Green
    }
    else {
        Write-Host "Errors found:" -ForegroundColor Red
        $allErrors | Format-Table -Property File, Question, Options, SelectedAnswer, Explanation, AIAnswer, Error -AutoSize -Wrap
    }
}
else {
    Write-Error "Path not found: $Path"
}