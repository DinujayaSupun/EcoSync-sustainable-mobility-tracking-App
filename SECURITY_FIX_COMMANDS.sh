# 🚨 EMERGENCY: Remove Sensitive Files from Git

# Step 1: Stop tracking .history folder (VS Code Local History)
git rm -r --cached .history/
git commit -m "Remove sensitive .history files from tracking"

# Step 2: Update .gitignore to prevent this
# (This will be done automatically)

# Step 3: Remove from GitHub
git push origin main

# IMPORTANT: This removes from tracking but files still exist in git history!
# Anyone who cloned before will still have access to old credentials.

# To completely remove from history (ADVANCED - use with caution):
# git filter-branch --force --index-filter \
#   "git rm -rf --cached --ignore-unmatch .history/" \
#   --prune-empty --tag-name-filter cat -- --all
# git push origin --force --all

# CRITICAL: After this, you MUST change all credentials in MongoDB Atlas!
