$files = Get-ChildItem -Path 'n:\NDI Projects\GitHub Projects\Elicom\elicom-frontend\src\app' -Filter *.ts -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -like '*https://localhost:44311*') {
        $content = $content -replace 'https://localhost:44311', 'https://localhost:44311'
        Set-Content -Path $file.FullName -Value $content -NoNewline
    }
}
