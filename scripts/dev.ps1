param(
    [string]$RepoRoot,
    [string]$NodeScript
)

Set-Location $RepoRoot
& node $NodeScript
exit $LASTEXITCODE
