foreach ($branch in $featureBranches) {
    Write-Host "Merging $branch into dev..." -ForegroundColor Yellow
    
    # Attempt to merge locally
    $mergeResult = git merge $branch --no-edit
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully merged $branch locally" -ForegroundColor Green
        
        # 1. Push the updated dev branch to GitHub
        git push origin dev
        
        # 2. DELETE the Remote branch (The Golden Copy Cleanup)
        # This removes 'feature/xyz' from GitHub
        Write-Host "🧹 Deleting remote branch from GitHub..." -ForegroundColor Gray
        git push origin --delete $branch
        
        Write-Host "✨ Remote $branch is gone. Local copy preserved." -ForegroundColor Cyan
    } else {
        Write-Host "❌ Conflict in $branch. Aborting merge to protect dev." -ForegroundColor Red
        git merge --abort
    }
}